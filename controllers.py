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

from py4web import action, request, abort, URL
from py4web.utils.url_signer import URLSigner
from .common import db, session, Field, T, cache, auth, logger, authenticated, unauthenticated, flash
from .models import get_user_id, get_time
from pydal.validators import *

url_signer = URLSigner(session)

# Returns the paths to the other controller routes that can be accessed from the home page
@action('index', method='GET')
@action.uses('index.html', url_signer)
def index():
    return dict(
        load_matchings_url = URL('load_matchings', signer=url_signer),
        add_matching_url = URL('add_matching', signer=url_signer),
        delete_matching_url = URL('delete_matching', signer=url_signer)
    )

# Loads the user's matchings to be displayed on home page
@action('load_matchings')
@action.uses(url_signer.verify(), db)
def load_matchings():
    my_settings = db(db.settings.user_id == get_user_id()).select().first()
    if my_settings is None:
        db.settings.insert() # Ensure the current user has an entry in db.settings
    matchings = db(db.matchings.user_id == get_user_id()).select()
    for m in matchings:
        m['num_classes'] = m.classes.count()
        m['num_professors'] = m.professors.count()
        m['num_matches'] = m.matches.count()
    return dict(matchings=matchings)

# This route is for adding a matching
@action('add_matching', method='POST')
@action.uses(url_signer.verify(), db)
def add_matching():
    id = db.matchings.insert(
        name = request.json.get('name'),
        description = request.json.get('description')
    )
    my_settings = db(db.settings.user_id == get_user_id()).select().first()
    assert my_settings is not None
    my_settings.matching_ids = my_settings.matching_ids + [id]
    my_settings.update_record()
    print(f'Added matching {request.json.get("name")} with ID {id}')
    return dict(id=id, date=get_time())

# This route is for deleting a matching
@action('delete_matching', method='POST')
@action.uses(url_signer.verify(), db)
def delete_matching():
    id = request.json.get('id') # Database ID of the matching
    assert id is not None
    db(db.matchings.id == id).delete()
    my_settings = db(db.settings.user_id == get_user_id()).select().first()
    assert my_settings is not None
    my_settings.matching_ids.remove(id)
    my_settings.update_record()
    return 'ok'

# TODO
# Note: my_id is the ID of the matching for the user, not the global matching ID.
# Thus, every user should be able to use the url '/matching/1'
# This route should return the paths to other controller routes, such as:
# add/edit/delete class, add/edit/delete professor, add/edit/delete match, edit this matching
@action('matching/<my_id:int>')
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
@action('add_class', method='POST')
@action.uses(url_signer.verify(), db)
def add_class():
    return dict()

# This route is for editing a class
@action('edit_class', method='POST')
@action.uses(url_signer.verify(), db)
def edit_class():
    return dict()

# This route is for deleting a class
@action('delete_class', method='POST')
@action.uses(url_signer.verify(), db)
def delete_class():
    return 'ok'

# This route is for adding a professor
@action('add_professor', method='POST')
@action.uses(url_signer.verify(), db)
def add_professor():
    return dict()

# This route is for editing a professor
@action('edit_professor', method='POST')
@action.uses(url_signer.verify(), db)
def edit_professor():
    return dict()

# This route is for deleting a professor
@action('delete_professor', method='POST')
@action.uses(url_signer.verify(), db)
def delete_professor():
    return dict()

# This route is for adding a match of class/professor/quarter
@action('add_match', method='POST')
@action.uses(url_signer.verify(), db)
def add_match():
    return dict()

# This route is for editing a match of class/professor/quarter
@action('edit_match', method='POST')
@action.uses(url_signer.verify(), db)
def edit_match():
    return dict()

# This route is for deleting a match of class/professor/quarter
@action('delete_match', method='POST')
@action.uses(url_signer.verify(), db)
def delete_match():
    return dict()