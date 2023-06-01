let app = {};

// Creates & initializes a Vue instance
let init = function (app) {
  app.data = {
    // for accordions to work
    left_sel: 0,
    right_sel: 0,

    // Details about this matching
    matching_name: '',
    matching_description: '',
    num_quarters: 0,
    quarter_names: [],

    view: 0, // View that the user is on
    classes: [],
    professors: [],
    matches: [],
    add_class_name: '',
    add_class_description: '',
    add_class_num_sections: [],
    add_class_mode: false,
    add_professor_name: '',
    add_professor_description: '',
    add_professor_classes: [],
    add_professor_mode: false,
    add_match_class: -1,
    add_match_professor: -1,
    add_match_quarter: -1,
    add_match_mode: false,
    search_class: '',
    search_professor: '',
    hovered_class_term: {},
    update_dropdown_menu: 0,
    dropdown_hover: false,
  };

  // This function is called to add a class.
  // app.vue.add_class_name is the name of the class.
  // app.vue.add_class_description is the description of the class.
  app.add_class = function () {
    const name = app.vue.add_class_name;
    const description = app.vue.add_class_description;
    for(let i=0; i<app.vue.add_class_num_sections.length; i++) {
      app.vue.add_class_num_sections[i] = parseInt(app.vue.add_class_num_sections[i]);
    }
    const num_sections = app.vue.add_class_num_sections;
    if (name === '') {
      console.error('Class must have name');
      return;
    }
    const curTime = new Date();
    console.log(`Adding class ${name}`);
    app.vue.classes.push({
      id: -1,
      name: name,
      description: description,
      num_sections: num_sections,
      created_on: curTime.toString()
    });
    app.reset_class_form();
    app.vue.add_class_mode = false;
    axios.post(add_class_url, {
      name: name,
      description: description,
      num_sections: num_sections,
      created_on: curTime.toString()
    }).then(function (response) {
      console.log(`Added class ${name}`);
      if(!app.update_local_class(name, response.data.id)) {
        console.error(`After added class, unable to add ID ${response.data.id}`);
      }
    }).catch(function (error) {
      console.error(`Error when adding class ${name}:`, error);
      if(!app.remove_local_class(name)) {
        console.error(`Error when un-adding class ${name}, not found`);
      }
    });
  }

  // Given the name of a class and id, update its ID in app.vue.classes
  app.update_local_class = function (name, id) {
    for(let i = app.vue.classes.length - 1; i >= 0; i--) {
      if(app.vue.classes[i].name === name && app.vue.classes[i].id === -1) {
        app.vue.classes[i].id = id;
        return true;
      }
    }
    return false;
  }

  // Given the name of a class, removes it from app.vue.classes
  app.remove_local_class = function (name) {
    for (let i = app.vue.classes.length - 1; i >= 0; i--) {
      if (app.vue.classes[i].name === name) {
        app.vue.classes.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  // This function resets the form to add a class.
  app.reset_class_form = function () {
    app.vue.add_class_name = `Class ${app.vue.classes.length + 1}`;
    app.vue.add_class_description = '';
    app.vue.add_class_num_sections = Array(app.vue.num_quarters).fill(0);
  }

  // TODO
  // Write Vue function app.edit_class
  // Write controller function edit_class
  // Add frontend URL & button
  app.edit_class = function (idx) {

  }

  // This function is called to delete a class.
  // 'idx' is the index (0-indexed) of the class in app.vue.classes
  app.delete_class = function (idx) {
    const id = app.vue.classes[idx].id;
    const name = app.vue.classes[idx].name;
    const description = app.vue.classes[idx].description;
    const num_sections = app.vue.classes[idx].num_sections;
    const created_on = app.vue.classes[idx].created_on;
    if(id < 0) {
      console.error(`Unable to delete class ${name} with id ${id}`);
      return;
    }
    if(!app.remove_local_class(name)){
      console.error(`Error when deleting class ${name}: Not found`);
      return;
    }

    axios.post(delete_class_url, {
      id: id
    }).then(function (response) {
      console.log(`Deleted class ${name}`);

      // Delete matches that contain this class.
      for (let i=0; i<app.vue.matches.length; i++) {
        if(app.vue.matches[i].class_id === id) {
          app.vue.matches.splice(i, 1);
          i--;
        }
      }

      // Delete class requests that are of this class.
      for (let i=0; i<app.vue.professors.length; i++) {
        for (let j=0; j<app.vue.num_quarters; j++) {
          for (let k=0; k<app.vue.professors[i].requested_classes[j].length; k++) {
            if (app.vue.professors[i].requested_classes[j][k] === id) {
              app.vue.professors[i].requested_classes[j].splice(k, 1);
              k--;
            }
          }
        }
      }
    }).catch(function (error) {
      console.error(`Error when deleting class ${name}:`, error);
      app.vue.classes.push({
        id: id,
        name: name,
        description: description,
        num_sections: num_sections,
        created_on: created_on
      });
    });
  }

  // This function is called to add a professor.
  // app.vue.add_professor_name is the name of the professor.
  // app.vue.add_professor_description is the description of the professor.
  // app.vue.add_professor_classes are the classes requested by the professor for each quarter.
  app.add_professor = function () {
    const name = app.vue.add_professor_name;
    const description = app.vue.add_professor_description;
    const requested_classes = app.vue.add_professor_classes;
    for (let i=0; i<app.vue.num_quarters; i++) {
      for (let j=0; j<requested_classes[i].length; j++) {
        if (requested_classes[i][j] < 0) {
          console.log(`Unable to add professor with requested class #${requested_classes[i][j]}`);
          return;
        }
      }
    }
    if (name === '') {
      console.error('Professor must have name');
      return;
    }
    const curTime = new Date();
    console.log(`Adding professor ${name}`);
    app.vue.professors.push({
      id: -1,
      name: name,
      description: description,
      requested_classes: requested_classes,
      created_on: curTime.toString()
    });
    app.reset_professor_form();
    app.vue.add_professor_mode = false;
    axios.post(add_professor_url, {
      name: name,
      description: description,
      requested_classes: requested_classes,
      created_on: curTime.toString()
    }).then(function (response) {
      console.log(`Added professor ${name}`);
      if(!app.update_local_professor(name, response.data.id)) {
        console.error(`After adding professor, unable to add ID ${response.data.id}`);
      }
    }).catch(function (error) {
      console.error(`Error when adding professor ${name}:`, error);
      if(!app.remove_local_professor(name)) {
        console.error(`Error when un-adding professor ${name}, not found`);
      }
    });
  }

  // Given the name of a professor and id, update its ID in app.vue.professors
  app.update_local_professor = function (name, id) {
    for(let i = app.vue.professors.length - 1; i >= 0; i--) {
      if(app.vue.professors[i].name === name && app.vue.professors[i].id === -1) {
        app.vue.professors[i].id = id;
        return true;
      }
    }
    return false;
  }

  // Given the name of a professor, removes it from app.vue.professors
  app.remove_local_professor = function (name) {
    for (let i = app.vue.professors.length - 1; i >= 0; i--) {
      if (app.vue.professors[i].name === name) {
        app.vue.professors.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  // This function resets the form to add a professor.
  app.reset_professor_form = function () {
    app.vue.add_professor_name = `Professor ${app.vue.professors.length + 1}`;
    app.vue.add_professor_description = '';
    app.vue.add_professor_classes = Array(app.vue.num_quarters).fill([]);
  }

  // TODO
  // Write Vue function app.edit_professor
  // Write controller function edit_professor
  // Add frontend URL & button
  app.edit_professor = function (idx) {

  }

  // This function is called to delete a professor.
  // 'idx' is the index (0-indexed) of the professor in app.vue.professors
  app.delete_professor = function (idx) {
    const id = app.vue.professors[idx].id;
    const name = app.vue.professors[idx].name;
    const description = app.vue.professors[idx].description;
    const requested_classes = app.vue.professors[idx].requested_classes;
    const created_on = app.vue.professors[idx].created_on;
    if(id < 0) {
      console.error(`Unable to delete professor ${name} with id ${id}`);
      return;
    }
    if(!app.remove_local_professor(name)){
      console.error(`Error when deleting professor ${name}: Not found`);
      return;
    }

    axios.post(delete_professor_url, {
      id: id
    }).then(function (response) {
      console.log(`Deleted professor ${name}`);

      // Delete matches that contain this professor.
      for (let i=0; i<app.vue.matches.length; i++) {
        if(app.vue.matches[i].professor_id === id) {
          app.vue.matches.splice(i, 1);
          i--;
        }
      }
    }).catch(function (error) {
      console.error(`Error when deleting professor ${name}:`, error);
      app.vue.professors.push({
        id: id,
        name: name,
        description: description,
        requested_classes: requested_classes,
        created_on: created_on
      });
    });
  }

  // This function is called to add a match.
  // app.vue.add_match_class is the index of the class in app.vue.classes.
  // app.vue.add_match_professor is the index of the professor in app.vue.professors.
  // app.vue.add_match_quarter is the index of the quarter in app.vue.quarter_names.
  app.add_match = function () {
    if(app.vue.add_match_class < 0) {
      console.error('Class is required');
      return;
    }
    if(app.vue.add_match_professor < 0) {
      console.error('Professor is required');
      return;
    }
    if(app.vue.add_match_quarter < 0) {
      console.error('Quarter is required');
      return;
    }
    const Class = app.vue.classes[app.vue.add_match_class];
    const Professor = app.vue.professors[app.vue.add_match_professor];
    const Quarter = app.vue.add_match_quarter;
    const curTime = new Date();
    if(Class.id < 0){
      console.error(`Unable to add match to class ${Class.id}`);
      return;
    }
    if(Professor.id < 0){
      console.error(`Unable to add match to professor ${Professor.id}`);
      return;
    }
    console.log(`Adding match: [${Professor.name}, ${Class.name}] in ${app.vue.quarter_names[Quarter]}`);
    app.vue.matches.push({
      id: -1,
      class_id: Class.id,
      professor_id: Professor.id,
      quarter: Quarter,
      created_on: curTime.toString()
    });
    app.reset_match_form();
    app.vue.add_match_mode = false;
    axios.post(add_match_url, {
      class_id: Class.id,
      professor_id: Professor.id,
      quarter: Quarter,
      created_on: curTime.toString()
    }).then(function (response) {
      console.log(`Added match: [${Professor.name}, ${Class.name}] in ${app.vue.quarter_names[Quarter]}`);
      if(!app.update_local_match(Class.id, Professor.id, response.data.id)) {
        console.error(`After adding match, unable to add ID ${response.data.id}`);
      }
    }).catch(function (error) {
      console.error(`Error when adding match ${Professor.name} & ${Class.name}:`, error);
      if(!app.remove_local_match(Class.id, Professor.id)) {
        console.error(`Error when un-adding match ${Professor.name} & ${Class.name}, not found`);
      }
    });
  }

  // Given the match's class id, professor id, and id, update its ID in app.vue.matches
  app.update_local_match = function (class_id, professor_id, id) {
    for(let i = app.vue.matches.length - 1; i >= 0; i--) {
      if(app.vue.matches[i].class_id === class_id && app.vue.matches[i].professor_id === professor_id) {
        app.vue.matches[i].id = id;
        return true;
      }
    }
    return false;
  }

  // Given the match's class id and professor id, removes it from app.vue.matches
  app.remove_local_match = function (class_id, professor_id) {
    for (let i = app.vue.matches.length - 1; i >= 0; i--) {
      if(app.vue.matches[i].class_id === class_id && app.vue.matches[i].professor_id === professor_id) {
        app.vue.matches.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  // This function is called to delete a match.
  // 'idx' is the index (0-indexed) of the match in app.vue.matches
  app.delete_match = function (idx) {
    const id = app.vue.matches[idx].id;
    const class_id = app.vue.matches[idx].class_id;
    const professor_id = app.vue.matches[idx].professor_id;
    const quarter = app.vue.matches[idx].quarter;
    const created_on = app.vue.matches[idx].created_on;
    if(id < 0) {
      console.error(`Unable to delete Match [class #${class_id}, prof #${professor_id}]`);
      return;
    }
    if(!app.remove_local_match(class_id, professor_id)){
      console.error(`Error when deleting Match [class #${class_id}, prof #${professor_id}]: Not found`);
      return;
    }

    axios.post(delete_match_url, {
      id: id
    }).then(function (response) {
      console.log(`Deleted match [class #${class_id}, prof #${professor_id}]`);
    }).catch(function (error) {
      console.error(`Error when deleting match [class #${class_id}, prof #${professor_id}]:`, error);
      app.vue.matches.push({
        id: id,
        class_id: class_id,
        professor_id: professor_id,
        quarter: quarter,
        created_on: created_on
      });
    });
  }

  // This function resets the form to add a professor.
  app.reset_match_form = function () {
    app.vue.add_match_class = -1;
    app.vue.add_match_professor = -1;
    app.vue.add_match_quarter = -1;
  }

  app.set_add_class_status = (new_status) => {
    app.vue.add_class_mode = new_status;
  }

  app.set_add_professor_status = (new_status) => {
    app.vue.add_professor_mode = new_status;
  }

  app.set_add_match_status = (new_status) => {
    app.vue.add_match_mode = new_status;
  }
  
  app.hover_dropdown_menu = function(id){
    if (!app.vue.hovered_class_term[id]){
      app.vue.hovered_class_term[id] = true;
      app.force_update_dropdown_menu();
    }
  }

  app.unhover_dropdown_menu = function(id){
    if (app.vue.hovered_class_term[id]){
      app.vue.hovered_class_term[id] = false;
      app.force_update_dropdown_menu();
    }
  }

  app.initialize_hover = function(){
    for(c in app.vue.classes){
      for(q in app.vue.quarter_names){
        app.vue.hovered_class_term[app.vue.classes[c].id + app.vue.quarter_names[q]] = false;
      }
    };
  }

  app.force_update_dropdown_menu = function(){
    app.vue.update_dropdown_menu += 1;
  }

  app.methods = {
    add_class: app.add_class,
    edit_class: app.edit_class,
    delete_class: app.delete_class,
    add_professor: app.add_professor,
    edit_professor: app.edit_professor,
    delete_professor: app.delete_professor,
    set_add_class_status: app.set_add_class_status,
    set_add_professor_status: app.set_add_professor_status,
    set_add_match_status: app.set_add_match_status,
    add_match: app.add_match,
    delete_match: app.delete_match,
    hover_dropdown_menu: app.hover_dropdown_menu,
    unhover_dropdown_menu: app.unhover_dropdown_menu,
    initialize_hover: app.initialize_hover,
    force_update_dropdown_menu: app.force_update_dropdown_menu,
  }

  app.vue = new Vue({
    el: "#vue-target",
    data: app.data,
    methods: app.methods
  });

  // This function is called to fetch all the details of the matching.
  app.init = () => {
    axios.get(load_my_matching_url).then((response) => {
      app.vue.matching_name = response.data.matching_name;
      app.vue.matching_description = response.data.matching_description;
      app.vue.num_quarters = response.data.num_quarters;
      app.vue.quarter_names = response.data.quarter_names;
      
      app.vue.classes = response.data.classes;
      app.vue.professors = response.data.professors;
      app.vue.matches = response.data.matches;

      app.reset_class_form();
      app.reset_professor_form();
      app.reset_match_form();
      app.initialize_hover();
    }).catch((error) => {
      console.error('Failed to load my matching:', error);
    })

    document.getElementById('view_one').classList.remove('is-outlined');
  };

  app.init();
};

init(app);

// This vue instance conects nav view buttons to functionality in the container with id vue_target
let app_view = {};

let init2 = function (app_view) {

  app_view.data = {};

  app_view.change_view = (current_view) => {
    app.vue.view = current_view;

    if (current_view == 1){
      document.getElementById('view_one').classList.remove('is-outlined');
      document.getElementById('view_two').classList.add('is-outlined');
      document.getElementById('view_three').classList.add('is-outlined');
    }
    else if (current_view == 2){
      document.getElementById('view_one').classList.add('is-outlined');
      document.getElementById('view_two').classList.remove('is-outlined');
      document.getElementById('view_three').classList.add('is-outlined');
    }
    else if (current_view == 3){
      document.getElementById('view_one').classList.add('is-outlined');
      document.getElementById('view_two').classList.add('is-outlined');
      document.getElementById('view_three').classList.remove('is-outlined');
    }
    else{
      document.getElementById('view_one').classList.add('is-outlined');
      document.getElementById('view_two').classList.add('is-outlined');
      document.getElementById('view_three').classList.add('is-outlined');
    }
  };

  app_view.methods = {
    change_view: app_view.change_view,
  };

  app_view.vue = new Vue({
    el: "#app_view",
    data: app_view.data,
    methods: app_view.methods
  });

  app_view.init2 = () => {

  };

  app_view.init2();
};

init2(app_view);

//TODO
//Implement functionality for the search bar
let app_search= {};

let init3 = function (app_search) {

  app_search.data = {};

  app_search.methods = {};

  app_search.vue = new Vue({
    el: "#app_search",
    data: app_search.data,
    methods: app_search.methods
  });

  app_search.init3 = () => {

  };

  app_search.init3();
};

init3(app_search);

//Gets buttons to be visible when burger icon is present for small devices
window.addEventListener("resize", (event) => {
  if(window.innerWidth > 1024){
    document.getElementById('view_one').classList.add('is-inverted');
    document.getElementById('view_two').classList.add('is-inverted');
    document.getElementById('view_three').classList.add('is-inverted');
  }
  else{
    document.getElementById('view_one').classList.remove('is-inverted');
    document.getElementById('view_two').classList.remove('is-inverted');
    document.getElementById('view_three').classList.remove('is-inverted');
  }
}, true);

window.dispatchEvent(new Event("resize"));