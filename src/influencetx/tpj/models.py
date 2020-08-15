"""
TPJ models built from inspecting the TPJ database.

This contains models that are not managed by Django (in fact, TPJ database is readonly):
https://docs.djangoproject.com/en/1.11/ref/models/options/#managed.

You can generate a model from the database using the `inspectdb` management command. For example,
the Contributor model was created using the following command:

  ./djadmin.sh inspectdb --database tpj vIdealContributor_v2a

The resulting output was copied below and modified appropriately. You'll have to do the following
manually to clean this up:
  * Rearrange models' order.
  * Make sure each model has one field with primary_key=True.
  * Make sure each ForeignKey has `on_delete` set to the desired behavior.
  * You can rename the models, but don't rename db_table.
  * If you rename a field, make sure there's a db_column value matching the original column name.

The models in this file have been aggressively trimmed of fields. If you need other data, they may
be available on the source tables for these models---you should check the source tables.
"""
from django.conf import settings
from django.db import models
from influencetx.legislators import models as leg_models
import logging
log = logging.getLogger(__name__)


class Donor(models.Model):
    id = models.IntegerField(db_column='Ctrib_ID', primary_key=True, db_index=True)
    full_name = models.CharField(db_column='FullName', max_length=150, blank=True, null=True)
    last_name = models.CharField(db_column='Surname', max_length=100, blank=True, null=True)
    first_name = models.CharField(db_column='FirstName', max_length=45, blank=True, null=True)
    suffix = models.CharField(db_column='Suffix', max_length=10, blank=True, null=True)
    title = models.CharField(db_column='title', max_length=160, blank=True, null=True)
    city = models.CharField(db_column='City', max_length=30, blank=True, null=True)
    state = models.CharField(db_column='StateAbbr', max_length=2, blank=True, null=True)
    zipcode = models.CharField(db_column='ZipCode', max_length=10, blank=True, null=True)
    employer_id = models.IntegerField(db_column='Employer_ID', db_index=True,
                                      blank=True, null=True)
    employer = models.CharField(db_column='EMPLOYER', max_length=60, blank=True, null=True)
    occupation = models.CharField(db_column='Occupation', max_length=160, blank=True, null=True)
    interest_code = models.CharField(db_column='InterestCode', max_length=5, blank=True, null=True)
    other_interests = models.CharField(db_column='OtherInterests', max_length=255,
                                       blank=True, null=True)
    total_contributions = models.DecimalField(db_column='CTRIB_AMT', max_digits=11,
                                              decimal_places=2, blank=True, null=True)
    party = models.CharField(db_column='Party', max_length=7, blank=True, null=True)

    class Meta:
        managed = settings.TPJ_MANAGED
        db_table = 'contributors'

    def __str__(self):
        return self.full_name


class Filer(models.Model):
    id = models.IntegerField(db_column='iFILER_ID', primary_key=True, db_index=True)
    candidate_id = models.IntegerField(db_column='iCand_ID', blank=True, null=True, db_index=True)
    parent_candidate_id = models.IntegerField(
        db_column='iCand_Parent', blank=True, null=True,
        help_text='Parent id for deduped candidates. Matches candidate_id for non-dupes.',
    )
    title = models.CharField(max_length=15, blank=True, null=True)
    first_name = models.CharField(db_column='firstname', max_length=45, blank=True, null=True)
    last_name = models.CharField(db_column='surname', max_length=100, blank=True, null=True)
    suffix = models.CharField(max_length=5, blank=True, null=True)
    candidate_name = models.CharField(db_column='CandidateName', max_length=290,
                                      blank=True, null=True)
    city = models.CharField(max_length=30, blank=True, null=True)
    state = models.CharField(db_column='StateAbbr', max_length=2, blank=True, null=True)
    zipcode = models.CharField(db_column='Zipcode', max_length=10, blank=True, null=True)
    office = models.CharField(db_column='Office', max_length=100, blank=True, null=True)
    district = models.CharField(db_column='District', max_length=100, blank=True, null=True)
    party = models.CharField(db_column='Party', max_length=5, blank=True, null=True)


    class Meta:
        managed = settings.TPJ_MANAGED
        db_table = 'filers'

    @property
    def leg_id(self):
        """Get PK for matching Legislator."""
        try:
            id_map = leg_models.LegislatorIdMap.objects.get(tpj_filer_id=self.id)
            leg_obj = leg_models.Legislator.objects.get(openstates_leg_id=id_map.openstates_leg_id)
            return leg_obj.id
        except:
            return None

    def __str__(self):
        return f'{self.first_name} {self.last_name}'.strip()



class Contribution(models.Model):
    id = models.IntegerField(db_column='IDNO', primary_key=True, db_index=True)
    donor = models.ForeignKey(Donor, db_column='ctrib_ID', blank=True, null=True, on_delete=models.CASCADE)
    filer = models.ForeignKey(Filer, db_column='iFiler_ID', blank=True, null=True, on_delete=models.CASCADE)
    amount = models.DecimalField(db_column='CTRIB_AMT', max_digits=19,
                                 decimal_places=2, blank=True, null=True)
    date = models.DateTimeField(db_column='CONT_DATE', blank=True, null=True)
    election_year = models.IntegerField(db_column='eYear', blank=True, null=True)

    class Meta:
        managed = settings.TPJ_MANAGED
        db_table = 'contribs_2018'

    def __str__(self):
        return f'{self.id} {self.donor} {self.filer} {self.amount}'


class Contributionsummary(models.Model):
    donor = models.ForeignKey(Donor, db_column='ctrib_ID', blank=True, null=False,
                                related_name='donorsummarys', on_delete=models.CASCADE)
    filer = models.ForeignKey(Filer, db_column='ifiler_ID', on_delete=models.CASCADE,
                                related_name='filersummarys', blank=True, null=False)
    eyear = models.IntegerField(db_column='eyear', blank=True, null=False)
    cycle_total = models.DecimalField(db_column='cycle_total', max_digits=19, db_index=True,
                                 decimal_places=2, blank=True, null=False)

    class Meta:
        managed = settings.TPJ_MANAGED
        db_table = 'total_donorbyfiler_2018'

    def __str__(self):
        return f'{self.donor} {self.filer} {self.eyear} {self.cycle_total}'


class Contributiontotalbydonor(models.Model):
    donor = models.OneToOneField('Donor', db_column='ctrib_ID', primary_key=True,
                                    related_name='donortotals', on_delete=models.CASCADE)
    eyear = models.IntegerField(db_column='eyear', blank=True, null=True)
    cycle_total = models.DecimalField(db_column='cycle_total', max_digits=19, db_index=True,
                                      decimal_places=2, blank=True, null=True)

    class Meta:
        managed = settings.TPJ_MANAGED
        db_table = 'total_donor_2018'

    def __str__(self):
        return f'{self.donor} {self.eyear} {self.cycle_total}'
