from collections import Counter
from django.db.models import F
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.http import require_POST
from .catalog import BY_ID, GAMES, YEARS, games_for
from .forms import StartForm
from .models import Run

def home(request):
    initial = {}
    for field in ('start_year', 'end_year'):
        try:
            value = int(request.GET.get(field, ''))
            if value in YEARS:
                initial[field] = value
        except ValueError:
            pass
    form = StartForm(request.POST if request.method == 'POST' else None, initial=initial)
    if request.method == 'POST' and form.is_valid():
        if not request.session.session_key:
            request.session.create()
        run = Run.objects.create(owner=request.session.session_key, nickname=form.cleaned_data['nickname'].strip() or 'Player', years=[y for y in YEARS if form.cleaned_data['start_year'] <= y <= form.cleaned_data['end_year']])
        request.session['active_run'] = str(run.id)
        return redirect('play', run_id=run.id)
    active = None
    if request.session.get('active_run'):
        active = Run.objects.filter(id=request.session['active_run'], owner=request.session.session_key, completed_at__isnull=True).first()
    return render(request, 'game/home.html', {'form': form, 'active': active, 'covers': games_for(1998)[:3] + games_for(2015)[:3], 'game_count': len(GAMES), 'year_count': len(YEARS)})

def owned_run(request, run_id):
    if not request.session.session_key:
        raise Http404
    return get_object_or_404(Run, id=run_id, owner=request.session.session_key)

def play(request, run_id):
    run = owned_run(request, run_id)
    if run.completed_at:
        return redirect('result', run_id=run.id)
    year = run.years[run.next_index]
    return render(request, 'game/play.html', {'run': run, 'year': year, 'games': games_for(year), 'position': run.next_index + 1, 'progress': round(run.next_index / len(run.years) * 100), 'saved': [BY_ID[g] for g in run.choices[-4:]]})

@require_POST
def choose(request, run_id):
    run = owned_run(request, run_id)
    if run.completed_at:
        return redirect('result', run_id=run.id)
    try:
        index = int(request.POST.get('round', '-1'))
    except ValueError:
        index = -1
    # A stale/double-clicked submission must not save a choice for the next year.
    if index != run.next_index:
        return redirect('play', run_id=run.id)
    game = BY_ID.get(request.POST.get('game', ''))
    offered_ids = {g['id'] for g in games_for(run.years[index])}
    if not game or game['year'] != run.years[index] or game['id'] not in offered_ids:
        return render(request, 'game/error.html', {'message': 'That game is not part of this round.', 'run': run}, status=400)
    values = {'choices': run.choices + [game['id']], 'next_index': F('next_index') + 1}
    if index + 1 == len(run.years):
        values['completed_at'] = timezone.now()
    # Compare-and-swap also protects against simultaneous requests on SQLite.
    Run.objects.filter(id=run.id, next_index=index, completed_at__isnull=True).update(**values)
    return redirect('play', run_id=run.id)

def result(request, run_id):
    run = get_object_or_404(Run, id=run_id, completed_at__isnull=False)
    games = [BY_ID[g] for g in run.choices]
    counts = Counter(g['genre'] for g in games)
    breakdown = [{'genre': genre, 'count': count, 'percent': round(count / len(games) * 100)} for genre, count in counts.most_common()]
    top_count = breakdown[0]['count']
    top_genres = ' / '.join(row['genre'] for row in breakdown if row['count'] == top_count)
    url = request.build_absolute_uri(reverse('result', kwargs={'run_id': run.id}))
    replay = reverse('home') + f'?start_year={run.years[0]}&end_year={run.years[-1]}#start'
    return render(request, 'game/result.html', {'run': run, 'games': games, 'breakdown': breakdown, 'top_three': breakdown[:3], 'is_owner': request.session.session_key == run.owner, 'top_genres': top_genres, 'share_url': url, 'replay_url': replay})

@require_POST
def undo(request, run_id):
    run = owned_run(request, run_id)
    try:
        index = int(request.POST.get('round', '-1'))
    except ValueError:
        index = -1
    if index == run.next_index and index > 0:
        Run.objects.filter(id=run.id, next_index=index, choices=run.choices).update(
            choices=run.choices[:-1], next_index=index - 1, completed_at=None)
    return redirect('play', run_id=run.id)

def collection_image(request, run_id):
    from .poster import make_poster
    run = get_object_or_404(Run, id=run_id, completed_at__isnull=False)
    response = HttpResponse(make_poster(run, [BY_ID[g] for g in run.choices]), content_type='image/png')
    response['Content-Disposition'] = 'attachment; filename="save-one-collection.png"'
    return response
