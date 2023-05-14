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
    const num_sections = app.vue.add_class_num_sections;
    if (name === '') {
      console.log('Class must have name');
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
    }).catch(function (error) {
      console.log(`Error when adding class ${name}:`);
      console.log(error);
      if(!app.remove_local_class(name)) {
        console.log(`Error when un-adding class ${name}, not found`);
      }
    });
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

  // TODO
  // Write Vue function app.delete_class
  // Write controller function delete_class
  // Add frontend URL & button
  app.delete_class = function (idx) {
    const name = app.vue.classes[idx].name;
    const description = app.vue.classes[idx].description;
    const num_sections = app.vue.classes[idx].num_sections;
    const created_on = app.vue.classes[idx].created_on;
    if(!app.remove_local_class(name)){
      console.log(`Error when deleting class ${name}: Not found`);
      return;
    }

    axios.post(delete_class_url, {
      idx: idx
    }).then(function (response) {
      console.log(`Deleted class ${name}`);
    }).catch(function (error) {
      console.log(`Error when deleting class ${name}:`);
      console.log(error);
      app.vue.classes.push({
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
    const prof_classes = app.vue.add_professor_classes;
    if (name === '') {
      console.log('Professor must have name');
      return;
    }
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
    set_add_professor_status: app.set_add_professor_status
  }

  app.vue = new Vue({
    el: "#vue-target",
    data: app.data,
    methods: app.methods
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
      console.log('Failed to load my matching:');
      console.log(error);
    })
  };

  app.init();
};

init(app);