let app = {};

// Creates & initializes a Vue instance
let init = function (app) {
  app.data = {
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
    num_quarters: 0, // Number of quarters in this matching
    quarter_names: [], // Name of the quarters for this matching
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
  // Write Vue function app.add_class
  // Write controller function add_class
  // Add frontend URL, form, & button to add a class
  app.add_class = function () {
    const name = app.vue.add_class_name;
    const description = app.vue.add_class_description;
    const num_sections = app.vue.add_class_num_sections;
    if (name === '') {
      console.log('Class must have name');
      return;
    }
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
      app.vue.classes = app.enumerate(response.data.classes);
      app.vue.professors = app.enumerate(response.data.professors);
      app.vue.matches = app.enumerate(response.data.matches);
      app.vue.num_quarters = response.data.num_quarters;
      app.vue.quarter_names = response.data.quarter_names;
    });
  };

  app.init();
};

init(app);