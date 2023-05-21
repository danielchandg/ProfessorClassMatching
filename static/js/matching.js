let app = {};

// Creates & initializes a Vue instance
let init = function (app) {
  app.data = {

    // Details about this matching
    matching_name: '',
    matching_description: '',
    num_quarters: 0,
    quarter_names: [],

    view: 1, // View that the user is on
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
    search_class: '',
    search_professor: '',
  };

  app.enumerate = function (a) {
    // This adds an _idx field to each element of the array.
    let k = 0;
    a.map((e) => { e._idx = k++; });
    return a;
  };

  // TODO
  // Improve frontend form to add a class, currently can't modify # of sections
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
      _idx: app.vue.classes.length,
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
        for(let j = i; j < app.vue.classes.length; j++) {
          app.vue.classes[j]._idx = j;
        }
        return true;
      }
    }
    return false;
  }

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

  // Done
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
    }).catch(function (error) {
      console.error(`Error when deleting class ${name}:`, error);
      app.vue.classes.push({
        id: id,
        _idx: app.vue.classes.length,
        name: name,
        description: description,
        num_sections: num_sections,
        created_on: created_on
      });
    });
  }


  // TODO
  // Write Vue function app.add_professor
  // Write controller function add_professor
  // Add frontend URL, form, & button
  app.add_professor = function () {
    const name = app.vue.add_professor_name;
    const description = app.vue.add_professor_description;
    const requested_classes = app.vue.add_professor_classes;
    if (name === '') {
      console.error('Professor must have name');
      return;
    }
    const curTime = new Date();
    console.log(`Adding professor ${name}`);
    app.vue.professors.push({
      id: -1,
      _idx: app.vue.professors.length,
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
        for(let j = i; j < app.vue.professors.length; j++) {
          app.vue.professors[j]._idx = j;
        }
        return true;
      }
    }
    return false;
  }

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

  // TODO
  // Write Vue function app.delete_professor
  // Write controller function delete_professor
  // Add frontend URL & button
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
    }).catch(function (error) {
      console.error(`Error when deleting professor ${name}:`, error);
      app.vue.professors.push({
        id: id,
        _idx: app.vue.professors.length,
        name: name,
        description: description,
        requested_classes: requested_classes,
        created_on: created_on
      });
    });
  }

  app.set_add_class_status = (new_status) => {
    app.vue.add_class_mode = new_status;
  }

  app.set_add_professor_status = (new_status) => {
    app.vue.add_professor_mode = new_status;
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
  }

  app.vue = new Vue({
    el: "#vue-target",
    data: app.data,
    methods: app.methods,
    mounted() {
      const tagsInputs = BulmaTagsInput.attach();
    },
  });

  // TODO
  // Write controller function load_my_matching
  app.init = () => {
    axios.get(load_my_matching_url).then((response) => {
      app.vue.matching_name = response.data.matching_name;
      app.vue.matching_description = response.data.matching_description;
      app.vue.num_quarters = response.data.num_quarters;
      app.vue.quarter_names = response.data.quarter_names;
      
      app.vue.classes = app.enumerate(response.data.classes);
      app.vue.professors = app.enumerate(response.data.professors);
      app.vue.matches = app.enumerate(response.data.matches);
      
      app.reset_class_form();
      app.reset_professor_form();
    }).catch((error) => {
      console.error('Failed to load my matching:', error);
    })
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