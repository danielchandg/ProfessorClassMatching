"""
This file defines actions, i.e. functions the URLs are mapped into
The @action(path) decorator exposed the function at URL:

    http://127.0.0.1:8000/{app_name}/{path}

If app_name == '_default' then simply

    http://127.0.0.1:8000/{path}

If path == 'index' it can be omitted:

    http://127.0.0.1:8000/

The path follows the bottlepy syntax.

@action.uses('generic.html')  indicates that the action uses the generic.html template
@action.uses(session)         indicates that the action uses the session
@action.uses(db)              indicates that the action uses the db
@action.uses(T)               indicates that the action uses the i18n & pluralization
@action.uses(auth.user)       indicates that the action requires a logged in user
@action.uses(auth)            indicates that the action requires the auth object

session, db, T, auth, and tempates are examples of Fixtures.
Warning: Fixtures MUST be declared with @action.uses({fixtures}) else your app will result in undefined behavior
"""

from py4web import action, request, abort, redirect, URL
from py4web.utils.form import Form, FormStyleBulma
from py4web.utils.url_signer import URLSigner
from .common import db, session, Field, T, cache, auth, logger, authenticated, unauthenticated, flash
from .models import get_user_id
from pydal.validators import *

url_signer = URLSigner(session)

@action('index', method=['GET', 'POST'])
@action.uses('index.html', db, auth.user, session, url_signer)
def index():
    my_settings = db(db.settings.user_id == get_user_id()).select().first()
    if my_settings is None:
        db.settings.insert()
        my_settings = db(db.settings.user_id == get_user_id()).select().first()
        assert my_settings is not None

    my_matchings = db(db.matchings.user_id == get_user_id()).select()
    MATCHINGS = []
    for matching in my_matchings:
        matching.num_classes = matching.classes.count()
        matching.num_professors = matching.professors.count()
        matching.num_matches = matching.matches.count()
        MATCHINGS.append(matching)

    my_names = [matching.name for matching in my_matchings]
    default_id = 1
    while True:
        if f'Matching {default_id}' not in my_names:
            break
        default_id += 1
    
    def is_name_unique(form):
        if form.vars['Name'] in my_names:
            form.errors['Name'] = T('Name must be unique')

    form = Form([Field('Name', default=f'Matching {default_id}', required=True),
                 Field('Description')],
                 deletable=False,
                 dbio=False,
                 validation=is_name_unique,
                 csrf_session=session,
                 formstyle=FormStyleBulma)
                
    if form.accepted:
        matching_id = db.matchings.insert(name=form.vars['Name'], description=form.vars['Description'])
        my_settings.matching_ids = my_settings.matching_ids + [matching_id]
        my_settings.update_record()
        my_id = len(my_settings.matching_ids)
        redirect(URL(f'matching/{my_id}'))
    
    return dict(matchings=MATCHINGS, form=form)

# This route is for inserting a new matching
@action('index/matching', method=['GET', 'POST'])
@action.uses('add_matching.html', db, auth.user, session, url_signer)
def add_matching():
    return dict()

# This route is for deleting a matching
# Note: my_id is the ID of the matching for the user, not the global matching ID.
@action('index/<my_id:int>', method=['DELETE'])
@action.uses(db, auth.user, session, url_signer.verify())
def delete_matching(my_id=None):
    return dict()

# Note: my_id is the ID of the matching for the user, not the global matching ID.
# Thus, every user should be able to use the url '/matching/1'
@action('matching/<my_id:int>', method=['GET'])
@action.uses('matching.html', db, auth.user, session, url_signer)
def matching(my_id=None):
    assert my_id is not None
    my_settings = db(db.settings.user_id == get_user_id()).select().first()
    assert my_settings is not None
    assert 1 <= my_id and my_id <= len(my_settings.matching_ids)
    matching_id = my_settings.matching_ids[my_id - 1]
    my_matching = db.matchings[matching_id]



    assert my_matching.user_id == get_user_id()
    return dict(my_id=my_id, matching_id=matching_id)

# This route is for adding a class
# Note: my_id is the ID of the matching for the user, not the global matching ID.
@action('matching/<my_id:int>/class', method=['GET', 'POST'])
@action.uses('add_class.html', db, auth.user, session, url_signer)
def add_class(my_id=None):
    return dict()

# This route is for editing a class
# Note: my_id is the ID of the matching for the user, not the global matching ID.
@action('matching/<my_id:int>/class/<class_id:int>', method=['GET', 'POST'])
@action.uses('edit_class.html', db, auth.user, session, url_signer)
def edit_class(my_id=None, class_id=None):
    return dict()

# This route is for deleting a class
# Note: my_id is the ID of the matching for the user, not the global matching ID.
@action('matching/<my_id:int>/class/<class_id:int>', method=['DELETE'])
@action.uses(db, auth.user, session, url_signer.verify())
def delete_class(my_id=None, class_id=None):
    return dict()

# This route is for adding a professor
# Note: my_id is the ID of the matching for the user, not the global matching ID.
@action('matching/<my_id:int>/professor', method=['GET', 'POST'])
@action.uses('add_professor.html', db, auth.user, session, url_signer)
def add_professor(my_id=None):
    return dict()

# This route is for editing a professor
# Note: my_id is the ID of the matching for the user, not the global matching ID.
@action('matching/<my_id:int>/professor/<professor_id:int>', method=['GET', 'POST'])
@action.uses('edit_professor.html', db, auth.user, session, url_signer)
def edit_professor(my_id=None, professor_id=None):
    return dict()

# This route is for deleting a professor
# Note: my_id is the ID of the matching for the user, not the global matching ID.
@action('matching/<my_id:int>/professor/<professor_id:int>', method=['DELETE'])
@action.uses(db, auth.user, session, url_signer.verify())
def delete_professor(my_id=None, professor_id=None):
    return dict()

# This route is for adding a match of class/professor/quarter
# Note: my_id is the ID of the matching for the user, not the global matching ID.
@action('matching/<my_id:int>/matches', method=['GET', 'POST'])
@action.uses('add_match.html', db, auth.user, session, url_signer)
def add_match(my_id=None):
    return dict()

# This route is for editing a match of class/professor/quarter
# Note: my_id is the ID of the matching for the user, not the global matching ID.
@action('matching/<my_id:int>/matches/<match_id:int>', method=['GET', 'POST'])
@action.uses('edit_match.html', db, auth.user, session, url_signer)
def edit_match(my_id=None, match_id=None):
    return dict()

# This route is for deleting a match of class/professor/quarter
# Note: my_id is the ID of the matching for the user, not the global matching ID.
@action('matching/<my_id:int>/matches/<match_id:int>', method=['DELETE'])
@action.uses(db, auth.user, session, url_signer.verify())
def delete_match(my_id=None, match_id=None):
    return dict()



# I think this code is not necessary. Daniel said it was old code.

# # This route is whenever the user edits any part of a matching.
# # - Add/Edit/Delete a class
# # - Add/Edit/Delete a professor
# # - Add/Edit/Delete a match
# @action('matching/<matching_id:int>', method=['POST'])
# @action.uses(db, auth.user, session, url_signer.verify())
# def edit_matching(matching_id=None):
#     redirect(URL(f'matching/{matching_id}'))

# # This route is whenever the user deletes a matching.
# @action('matching/<matching_id:int>', method=['DELETE'])
# @action.uses(db, auth.user, session, url_signer.verify())
# def delete_matching(matching_id=None):
#     redirect(URL(f'matching/{matching_id}'))