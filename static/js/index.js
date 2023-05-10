let app = {};

// Creates & initializes a Vue instance
let init = function (app) {
  app.data = {
    matchings: [], // Matchings of the user
    add_matching_name: '', // Name of the matching that the user wants to add
    add_matching_description: '',
    add_mode: false, // Is the user currently adding a matching?
  };

  app.enumerate = function (a) {
    // This adds an _idx field to each element of the array.
    let k = 0;
    a.map((e) => { e._idx = k++; });
    return a;
  };

  app.add_matching = function () {
    if (app.vue.add_matching_name === '') {
      console.log('Matching must have name');
      return;
    }
    console.log(`Adding matching ${app.vue.add_matching_name}`);
    axios.post(add_matching_url, {
      name: app.vue.add_matching_name,
      description: app.vue.add_matching_description
    }).then(function (response) {
      app.vue.matchings.push({
        id: response.data.id,
        name: app.vue.add_matching_name,
        description: app.vue.add_matching_description,
        num_classes: 0,
        num_professors: 0,
        num_matches: 0,
        created_on: response.data.date
      });
      app.enumerate(app.vue.matchings);
      app.vue.add_matching_name = `Matching ${app.vue.matchings.length + 1}`;
    })
    app.vue.add_mode = false;
  }

  app.goto_matching = function (idx) {
    let url = goto_matching_url + '/' + (idx + 1);
    let a = document.createElement('a');
    a.href = url;
    a.click();
  }

  app.duplicate_matching = function (idx) {
    const id = app.vue.matchings[idx].id;
    console.log(`Duplicating matching ${app.vue.matchings[idx].name}`)
    axios.post(duplicate_matching_url, {
      id: id
    }).then(function (response) {
      app.vue.matchings.push({
        id: response.data.id,
        name: app.vue.matchings[idx].name,
        classes: app.vue.matchings[idx].num_classes,
        professors: app.vue.matchings[idx].num_professors,
        matches: app.vue.matchings[idx].num_matches,
        created_on: response.data.date
      });
      app.enumerate(app.vue.matchings);
    })
  }

  app.rename_matching = function () {

  }

  app.delete_matching = function (idx) {
    const id = app.vue.matchings[idx].id;
    axios.post(delete_matching_url, {
      id: id
    }).then(function (response) {
      let found = false;
      for (let i = 0; i < app.vue.matchings.length; i++) {
        if (app.vue.matchings[i].id === id) {
          app.vue.matchings.splice(i, 1);
          app.enumerate(app.vue.matchings);
          found = true;
          break;
        }
      }
      if (found) console.log(`Deleted matching ${id}`);
      else console.log(`Error: Unable to find matching ${id} in frontend`);
    })
  }

  app.set_add_status = (new_status) => {
    app.vue.add_mode = new_status;
  }

  app.methods = {
    add_matching: app.add_matching,
    goto_matching: app.goto_matching,
    delete_matching: app.delete_matching,
    duplicate_matching: app.duplicate_matching,
    rename_matching: app.rename_matching,
    set_add_status: app.set_add_status
  }

  app.vue = new Vue({
    el: "#vue-target",
    data: app.data,
    methods: app.methods
  });

  app.init = () => {
    axios.get(load_matchings_url).then((response) => {
      app.vue.matchings = app.enumerate(response.data.matchings);
    });
  };

  app.init();
};

init(app);