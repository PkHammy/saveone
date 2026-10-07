from django.test import Client, TestCase, override_settings
from django.urls import reverse
from .catalog import YEARS, GAMES, games_for
from .models import Run
from .catalog import BY_ID
from urllib.parse import urlparse
@override_settings(STORAGES={'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'}, 'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'}})
class GameTests(TestCase):
    def test_undo_owner_stale_and_completed(self):
        run = self.start(2025, 2025)
        self.choose(run, 2025, 0)
        url = reverse('undo', args=[run.id])
        self.assertEqual(Client().post(url, {'round': 1}).status_code, 404)
        self.assertEqual(self.client.get(url).status_code, 405)
        self.client.post(url, {'round': 1})
        run.refresh_from_db()
        self.assertEqual(run.choices, [])
        self.assertEqual(run.next_index, 0)
        self.assertIsNone(run.completed_at)
        self.choose(run, 2025, 0)
        self.client.post(url, {'round': 0})
        run.refresh_from_db()
        self.assertEqual(len(run.choices), 1)

    def test_collection_image_and_top_three(self):
        from PIL import Image
        from io import BytesIO
        run = self.start(2025, 2025)
        url = reverse('collection_image', args=[run.id])
        self.assertEqual(self.client.get(url).status_code, 404)
        self.choose(run, 2025, 0)
        response = Client().get(url)
        self.assertEqual(response['Content-Type'], 'image/png')
        image = Image.open(BytesIO(response.content))
        self.assertEqual(image.width, 1200)
        image.verify()
        result = self.client.get(reverse('result', args=[run.id]))
        self.assertEqual(len(result.context['top_three']), 1)
        self.assertContains(result, 'Download collection image')

    def test_compilations_follow_main_games(self):
        games = games_for(2021)
        collection = next(i for i, g in enumerate(games) if 'The Trilogy' in g['title'])
        self.assertGreater(collection, 11)

    def start(self, start=2023, end=2024):
        response = self.client.post(reverse('home'), {'nickname': 'Ada', 'start_year': start, 'end_year': end})
        self.assertEqual(response.status_code, 302)
        return Run.objects.latest('created_at')
    def choose(self, run, year, index):
        return self.client.post(reverse('choose', args=[run.id]), {'game': games_for(year)[0]['id'], 'round': index})
    def test_complete_and_share_with_another_browser(self):
        run = self.start()
        self.assertEqual(Client().get(reverse('result', args=[run.id])).status_code, 404)
        self.choose(run, 2023, 0)
        self.choose(run, 2024, 1)
        run.refresh_from_db()
        self.assertIsNotNone(run.completed_at)
        response = Client().get(reverse('result', args=[run.id]))
        self.assertContains(response, "Ada")
        self.assertContains(response, 'Your most saved genre')
        self.assertEqual(sum(row['count'] for row in response.context['breakdown']), 2)
    def test_duplicate_submission_does_not_skip_round(self):
        run = self.start()
        self.choose(run, 2023, 0)
        self.choose(run, 2023, 0)
        run.refresh_from_db()
        self.assertEqual(run.next_index, 1)
        self.assertEqual(len(run.choices), 1)
    def test_foreign_owner_cannot_view_or_change_run(self):
        run = self.start()
        stranger = Client()
        self.assertEqual(stranger.get(reverse('play', args=[run.id])).status_code, 404)
        self.assertEqual(stranger.post(reverse('choose', args=[run.id]), {'round': 0, 'game': games_for(2023)[0]['id']}).status_code, 404)
    def test_invalid_game_and_wrong_year_rejected(self):
        run = self.start()
        self.assertEqual(self.choose(run, 1980, 0).status_code, 400)
        self.assertEqual(self.client.post(reverse('choose', args=[run.id]), {'round': 0, 'game': 'fake'}).status_code, 400)
        run.refresh_from_db()
        self.assertEqual(run.choices, [])
    def test_invalid_year_range(self):
        self.assertContains(self.client.post(reverse('home'), {'start_year': 2024, 'end_year': 1980}), 'Choose an end year')
        self.assertFalse(Run.objects.exists())
    def test_csrf_protection(self):
        run = self.start()
        secure = Client(enforce_csrf_checks=True)
        secure.cookies = self.client.cookies
        self.assertEqual(secure.post(reverse('choose', args=[run.id]), {'round': 0, 'game': games_for(2023)[0]['id']}).status_code, 403)
    def test_full_collection_and_ties(self):
        run = self.start(YEARS[0], YEARS[-1])
        for index, year in enumerate(YEARS):
            self.choose(run, year, index)
        run.refresh_from_db()
        self.assertEqual(len(run.choices), len(YEARS))
        self.assertEqual(run.next_index, len(YEARS))
        self.assertEqual(len(set(run.choices)), len(YEARS))
        self.assertEqual(self.client.get(reverse('play', args=[run.id])).status_code, 302)
        self.assertContains(Client().get(reverse('result', args=[run.id])), f'{len(YEARS)} games.')
    def test_single_year_tie_and_resume(self):
        run = self.start(2024, 2024)
        self.assertContains(self.client.get(reverse('home')), 'Continue playing')
        self.choose(run, 2024, 0)
        result = self.client.get(reverse('result', args=[run.id]))
        self.assertEqual(result.context['breakdown'][0]['percent'], 100)
        self.assertNotContains(self.client.get(reverse('home')), 'Continue playing')
    def test_catalog_integrity(self):
        self.assertEqual(YEARS, list(range(1980, 2026)))
        self.assertEqual(len(GAMES), len({g['id'] for g in GAMES}))
        self.assertTrue(all(len(games_for(year)) >= 25 for year in YEARS))
        self.assertTrue(all(g['verified_release_year'] == g['year'] for g in GAMES))
        self.assertTrue(all(urlparse(g['cover_url']).scheme == 'https' and urlparse(g['cover_url']).hostname in {'upload.wikimedia.org', 'thumb.wikimedia.org'} for g in GAMES))
    def test_replay_range(self):
        response = self.client.get(reverse('home') + '?start_year=2000&end_year=2010')
        self.assertEqual(response.context['form'].initial, {'start_year': 2000, 'end_year': 2010})

    def test_tied_genres_are_both_reported(self):
        run = self.start(2022, 2023)
        rpg = next(g for g in games_for(2022) if g['genre'] == 'RPG')
        adventure = next(g for g in games_for(2023) if g['genre'] == 'Adventure')
        self.client.post(reverse('choose', args=[run.id]), {'round': 0, 'game': rpg['id']})
        self.client.post(reverse('choose', args=[run.id]), {'round': 1, 'game': adventure['id']})
        response = self.client.get(reverse('result', args=[run.id]))
        self.assertEqual(response.context['top_genres'], 'RPG / Adventure')
        self.assertContains(response, '(tied)')
        self.assertEqual([row['percent'] for row in response.context['breakdown']], [50, 50])

    def test_legacy_collection_survives_catalogue_expansion(self):
        from django.utils import timezone
        run = Run.objects.create(owner='legacy-session', nickname='Old player',
                                 years=[2011], choices=['2011-minecraft'],
                                 next_index=1, completed_at=timezone.now())
        self.assertContains(Client().get(reverse('result', args=[run.id])), 'Minecraft')

    def test_round_renders_all_offered_games_and_artwork(self):
        run = self.start(1980, 1980)
        response = self.client.get(reverse('play', args=[run.id]))
        self.assertContains(response, 'class="game-choice"', count=len(games_for(1980)))
        self.assertContains(response, 'class="game-cover-image"', count=len(games_for(1980)))
        self.assertContains(response, 'Image credits', count=len(games_for(1980)))
        self.assertTrue(all(g['year'] == 1980 for g in response.context['games']))

    def test_recorded_earlier_release_excludes_later_ports(self):
        from tools.import_wikipedia import release_year
        def claim(year, rank='normal', precision=11):
            return {'rank': rank, 'mainsnak': {'datavalue': {'value': {'time': f'+{year}-01-01T00:00:00Z', 'precision': precision}}}}
        self.assertEqual(release_year({'claims': {'P577': [claim(1998), claim(2000)]}}), 1998)
        self.assertEqual(release_year({'claims': {'P577': [claim(1997, 'deprecated'), claim(1998)]}}), 1998)
        self.assertIsNone(release_year({'claims': {'P577': [claim(1990, precision=8)]}}))

    def test_films_series_and_expansions_are_not_game_choices(self):
        from tools.import_wikipedia import eligible
        date = {'mainsnak': {'datavalue': {'value': {'time': '+2020-01-01T00:00:00Z', 'precision': 11}}}}
        for entity_type in ('Q11424', 'Q7058673', 'Q209163'):
            entity = {'claims': {'P577': [date], 'P31': [{'mainsnak': {'datavalue': {'value': {'id': entity_type}}}}]}}
            self.assertFalse(eligible(entity, 2020))

    def test_pokemon_main_releases_appear_in_their_first_release_years(self):
        for year in (1996, 1998, 2002, 2006, 2013, 2016, 2019, 2022, 2025):
            titles = [g['title'].casefold().replace('é', 'e') for g in games_for(year)]
            self.assertTrue(any('pokemon' in title for title in titles), f'Pokemon missing from {year}')

    def test_archived_api_results_remain_shareable(self):
        from .catalog import ARCHIVED_GAMES
        from django.utils import timezone
        archived = next((g for g in ARCHIVED_GAMES if g['id'] not in {row['id'] for row in GAMES}), None)
        self.assertIsNotNone(archived)
        run = Run.objects.create(owner='archive-session', years=[archived['year']],
                                 choices=[archived['id']], next_index=1, completed_at=timezone.now())
        response = Client().get(reverse('result', args=[run.id]))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context['games'][0]['id'], archived['id'])

    def test_2025_is_available_and_default_end_year(self):
        response = self.client.get(reverse('home'))
        self.assertEqual(response.context['form'].fields['end_year'].initial, 2025)
        run = self.start(2025, 2025)
        self.assertEqual(run.years, [2025])
        response = self.client.get(reverse('play', args=[run.id]))
        self.assertGreater(len(response.context['games']), 25)
        self.assertTrue(all(g['verified_release_year'] == 2025 for g in response.context['games']))
        self.choose(run, 2025, 0)
        self.assertEqual(self.client.get(reverse('result', args=[run.id])).status_code, 200)
