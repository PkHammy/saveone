from django import forms
from .catalog import YEARS
class StartForm(forms.Form):
    nickname = forms.CharField(max_length=30, required=False, label='Your player name', widget=forms.TextInput(attrs={'placeholder': 'Player one', 'autocomplete': 'nickname'}))
    start_year = forms.TypedChoiceField(coerce=int, choices=[(y, y) for y in YEARS], initial=1980, label='Start year')
    end_year = forms.TypedChoiceField(coerce=int, choices=[(y, y) for y in YEARS], initial=YEARS[-1], label='End year')
    def clean(self):
        data = super().clean()
        if data.get('start_year', 0) > data.get('end_year', 9999):
            raise forms.ValidationError('Choose an end year on or after your start year.')
        return data
