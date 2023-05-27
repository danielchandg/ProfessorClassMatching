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
import json

url_signer = URLSigner(session)

# Returns the paths to the other controller routes that can be accessed from the home page
@action('index', method='GET')
@action.uses('index.html', url_signer, auth.user)
def index():
    return dict(
        load_matchings_url = URL('load_matchings', signer=url_signer),
        add_matching_url = URL('add_matching', signer=url_signer),
        delete_matching_url = URL('delete_matching', signer=url_signer)
    )

# Loads the user's matchings to be displayed on home page
@action('load_matchings')
@action.uses(url_signer.verify(), db, auth.user)
def load_matchings():
    # db(db.matchings).delete()
    my_settings = db(db.settings.user_id == get_user_id()).select().first()
    if my_settings is None:
        db.settings.insert() # Ensure the current user has an entry in db.settings
        my_settings = db(db.settings.user_id == get_user_id()).select().first()
    matchings = db(db.matchings.user_id == get_user_id()).select()
    matching_ids = []
    for m in matchings:
        m.num_classes = m.classes.count()
        m.num_professors = m.professors.count()
        m.num_matches = m.matches.count()
        m.created_on = m.time_created
        m.pop('time_created')
        matching_ids.append(m.id)
    
    # Note: This my_settings update can possibly be removed later on
    my_settings.matching_ids = matching_ids
    my_settings.update_record()

    return dict(matchings=matchings)

# This route is for adding a matching
@action('add_matching', method='POST')
@action.uses(url_signer.verify(), db, auth.user)
def add_matching():
    my_settings = db(db.settings.user_id == get_user_id()).select().first()
    assert my_settings is not None
    id = db.matchings.insert(
        name = request.json.get('name'),
        description = request.json.get('description'),
        num_quarters = request.json.get('num_quarters'),
        quarter_names = request.json.get('quarter_names'),
        time_created = request.json.get('created_on')
    )
    my_settings.matching_ids = my_settings.matching_ids + [id]
    my_settings.update_record()
    return dict(id=id)

# This route is for deleting a matching
@action('delete_matching', method='POST')
@action.uses(url_signer.verify(), db, auth.user)
def delete_matching():
    id = request.json.get('id') # Database ID
    db(db.matchings.id == id).delete()
    my_settings = db(db.settings.user_id == get_user_id()).select().first()
    assert my_settings is not None
    my_settings.matching_ids.remove(id)
    my_settings.update_record()
    return f'ok deleted matching {id}'

# This route is for duplicating a matching
# TODO:
# Needs to be tested
@action('duplicate_matching', method='POST')
@action.uses(url_signer.verify(), db, auth.user)
def duplicate_matching():
    created_on = request.json.get('created_on')
    old_matching_id = request.json.get('matching_id')
    my_matching = db.matchings[old_matching_id]
    assert my_matching is not None
    
    new_matching_id = db.matchings.insert(
        name = my_matching.name + ' copy',
        description = my_matching.description,
        num_quarters = my_matching.num_quarters,
        quarter_names = my_matching.quarter_names,
        time_created = created_on
    )
    old_to_new_class = dict()
    for c in my_matching.classes.select():
        old_id = c.id
        new_id = db.classes.insert(
            name = c.name,
            matching_id = new_matching_id,
            description = c.description,
            num_sections = c.num_sections,
            time_created = created_on
        )
        old_to_new_class[old_id] = new_id

    old_to_new_professor = dict()
    for p in my_matching.professors.select():
        old_id = p.id
        old_my_classes = p.my_classes
        new_my_classes = []
        for qc in old_my_classes:
            quarter_num, class_id = [int(i) for i in qc.split()]
            assert class_id in old_to_new_class
            new_my_classes.append(f'{quarter_num} {old_to_new_class[class_id]}')
        new_id = db.professors.insert(
            name_ = p.name,
            matching_id = new_matching_id,
            description = p.description,
            my_classes = new_my_classes,
            time_created = created_on
        )
        old_to_new_professor[old_id] = new_id

    for m in my_matching.matches.select():
        assert m.class_id in old_to_new_class
        assert m.professor_id in old_to_new_professor
        class_id = old_to_new_class[m.class_id]
        professor_id = old_to_new_professor[m.professor_id]
        db.matches.insert(
            matching_id = new_matching_id,
            class_id = class_id,
            professor_id = professor_id,
            quarter = m.quarter,
            time_created = created_on
        )

    return dict(id=new_matching_id)

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
    return dict(
        my_id=my_id,
        matching_id=matching_id,
        load_my_matching_url=URL('load_my_matching', matching_id, signer=url_signer),
        add_class_url = URL('add_class', matching_id, signer=url_signer),
        delete_class_url = URL('delete_class', matching_id, signer=url_signer),
        add_professor_url = URL('add_professor', matching_id, signer=url_signer),
        delete_professor_url = URL('delete_professor', matching_id, signer=url_signer),
        add_match_url = URL('add_match', matching_id, signer=url_signer),
        delete_match_url = URL('delete_match', matching_id, signer=url_signer)
    )

# Loads the user's matching for their matching page
@action('load_my_matching/<matching_id:int>')
@action.uses(url_signer.verify(), db, auth.user)
def load_my_matching(matching_id=None):
    assert matching_id is not None
    my_matching = db.matchings[matching_id]
    assert my_matching is not None
    matching_name = my_matching.name
    matching_description = my_matching.description
    num_quarters = my_matching.num_quarters
    quarter_names = my_matching.quarter_names

    classes = my_matching.classes.select()
    for c in classes:
        if len(c.num_sections) > num_quarters:
            del c.num_sections[num_quarters:]
            c.update_record()
        elif len(c.num_sections) < num_quarters:
            c.num_sections.extend([0] * (num_quarters - len(c.num_sections)))
            c.update_record()
        c.created_on = c.time_created
        c.pop('time_created')
    
    professors = my_matching.professors.select()
    
    for p in professors:
        p.requested_classes = [[] for _ in range(num_quarters)]
        for r in p.class_requests.select():
            if r.quarter >= num_quarters:
                r.delete_record()
                continue
            my_class = db.classes[r.class_id]
            assert my_class.matching_id == matching_id
            p.requested_classes[r.quarter].append(r.class_id)
        p.created_on = p.time_created
        p.pop('time_created')
        p.name = p.name_
        p.pop('name_')
    
    matches = my_matching.matches.select()

    for m in matches:
        if m.quarter > num_quarters:
            m.delete_record()
            continue
        m.created_on = m.time_created
        m.pop('time_created')

    return dict(
        matching_name=matching_name,
        matching_description=matching_description,
        num_quarters=num_quarters,
        quarter_names=quarter_names,
        classes=classes,
        professors=professors,
        matches=matches
    )

# This route is for adding a class
@action('add_class/<matching_id:int>', method='POST')
@action.uses(url_signer.verify(), db, auth.user)
def add_class(matching_id=None):
    assert matching_id is not None
    my_matching = db.matchings[matching_id]
    assert my_matching is not None
    assert my_matching.user_id == get_user_id()
    id = db.classes.insert(
        name = request.json.get('name'),
        matching_id = matching_id,
        description = request.json.get('description'),
        num_sections = request.json.get('num_sections'),
        time_created = request.json.get('created_on')
    )
    return dict(id=id)

# This route is for editing a class
@action('edit_class', method='POST')
@action.uses(url_signer.verify(), db)
def edit_class():
    return dict()

# This route is for deleting a class
@action('delete_class/<matching_id:int>', method='POST')
@action.uses(url_signer.verify(), db, auth.user)
def delete_class(matching_id=None):
    assert matching_id is not None
    id = request.json.get('id') # Database ID
    set_classes = db((db.classes.id == id) & (db.classes.matching_id == matching_id))
    assert set_classes.count() == 1
    set_classes.delete()
    return f'ok deleted class {id}'

# This route is for adding a professor
@action('add_professor/<matching_id:int>', method='POST')
@action.uses(url_signer.verify(), db, auth.user)
def add_professor(matching_id=None):
    assert matching_id is not None
    my_matching = db.matchings[matching_id]
    assert my_matching is not None
    assert my_matching.user_id == get_user_id()
    professor_id = db.professors.insert(
        name_ = request.json.get('name'),
        matching_id = matching_id,
        description = request.json.get('description'),
        time_created = request.json.get('created_on')
    )
    n = my_matching.num_quarters
    requested_classes = request.json.get('requested_classes')
    assert len(requested_classes) == n
    for quarter in range(n):
        for class_id in requested_classes[quarter]:
            my_class = db.classes[class_id]
            assert my_class.matching_id == matching_id
            db.class_requests.insert(
                professor_id = professor_id,
                class_id = class_id,
                quarter = quarter
            )
    return dict(id=professor_id)

# This route is for editing a professor
@action('edit_professor', method='POST')
@action.uses(url_signer.verify(), db)
def edit_professor():
    return dict()

# This route is for deleting a professor
@action('delete_professor/<matching_id:int>', method='POST')
@action.uses(url_signer.verify(), db)
def delete_professor(matching_id=None):
    assert matching_id is not None
    id = request.json.get('id') # Database ID
    set_professors = db((db.professors.id == id) & (db.professors.matching_id == matching_id))
    assert set_professors.count() == 1
    set_professors.delete()
    return f'ok deleted professor {id}'

# This route is for adding a match of class/professor/quarter
@action('add_match/<matching_id:int>', method='POST')
@action.uses(url_signer.verify(), db, auth.user)
def add_match(matching_id=None):
    assert matching_id is not None
    my_matching = db.matchings[matching_id]
    assert my_matching is not None
    assert my_matching.user_id == get_user_id()
    match_id = db.matches.insert(
        matching_id = matching_id,
        class_id = request.json.get('class_id'),
        professor_id = request.json.get('professor_id'),
        quarter = request.json.get('quarter'), # Quarter is 0-indexed
        time_created = request.json.get('created_on')
    )
    return dict(id=match_id)

# This route is for deleting a match of class/professor/quarter
@action('delete_match/<matching_id:int>', method='POST')
@action.uses(url_signer.verify(), db, auth.user)
def delete_match(matching_id=None):
    assert matching_id is not None
    id = request.json.get('id') # Database ID
    set_matches = db((db.matches.id == id) & (db.matches.matching_id == matching_id))
    assert set_matches.count() == 1
    set_matches.delete()
    return f'ok deleted match {id}'