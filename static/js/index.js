let app = {};

// Creates & initializes a Vue instance
let init = function (app) {
  app.data = {
    matchings: [], // Matchings of the user
    add_matching_name: '', // Name of the matching that the user wants to add
    add_matching_description: '',
    add_matching_num_quarters: 0, // Number of quarters
    add_mode: false, // Is the user currently adding a matching?
  };

  app.enumerate = function (a) {
    // This adds an _idx field to each element of the array.
    let k = 0;
    a.map((e) => { e._idx = k++; });
    return a;
  };

  app.parseDate = function (dateString) {
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  // Done
  app.add_matching = function () {
    const name = app.vue.add_matching_name;
    const description = app.vue.add_matching_description;
    const num_quarters = app.vue.add_matching_num_quarters;
    if (name === '') {
      console.error('Matching must have name');
      return;
    }
    if (num_quarters <= 0 || num_quarters >= 100) {
      console.error('Number of quarters must be in the range [1-99]');
      return;
    }
    const curTime = new Date();
    let quarter_names = [];
    if (num_quarters <= 4) {
      quarter_names = ['Fall', 'Winter', 'Spring', 'Summer'].slice(0, num_quarters);
    }
    else {
      for(let i=1; i<=num_quarters; i++) {
        quarter_names.push(`Quarter ${i}`);
      }
    }
    console.log(`Adding matching ${name}`);
    app.vue.matchings.push({
      id: -1,
      _idx: app.vue.matchings.length,
      name: name,
      description: description,
      num_classes: 0,
      num_professors: 0,
      num_matches: 0,
      num_quarters: num_quarters,
      created_on: curTime.toString()
    });
    app.reset_matching_form();
    app.vue.add_mode = false;
    axios.post(add_matching_url, {
      name: name,
      description: description,
      num_quarters: num_quarters,
      quarter_names: quarter_names,
      created_on: curTime.toString()
    }).then(function (response) {
      console.log(`Added matching ${name}`);
      if(!app.update_local_matching(name, response.data.id)) {
        console.error(`After added matching, unable to add ID ${response.data.id}`);
      }
    }).catch(function (error) {
      console.error(`Error when adding matching ${name}: ${JSON.stringify(error)}`);
      if(!app.remove_local_matching(name)) {
        console.error(`Error when un-adding matching ${name}, not found`);
      }
    });
  }

  // Given the name of a matching and id, update its ID in app.vue.matchings
  app.update_local_matching = function (name, id) {
    for(let i = app.vue.matchings.length - 1; i >= 0; i--) {
      if(app.vue.matchings[i].name === name && app.vue.matchings[i].id === -1) {
        app.vue.matchings[i].id = id;
        return true;
      }
    }
    return false;
  }

  // Given the name of a matching, removes it from app.vue.matchings
  app.remove_local_matching = function (name) {
    for (let i = app.vue.matchings.length - 1; i >= 0; i--) {
      if (app.vue.matchings[i].name === name) {
        app.vue.matchings.splice(i, 1);
        for(let j = i; j < app.vue.matchings.length; j++) {
          app.vue.matchings[j]._idx = j;
        }
        return true;
      }
    }
    return false;
  }

  app.reset_matching_form = function () {
    app.vue.add_matching_name = `Matching ${app.vue.matchings.length + 1}`;
    app.vue.add_matching_description = '';
    app.vue.add_matching_num_quarters = 0;
  }

  app.goto_matching = function (idx) {
    let url = goto_matching_url + '/' + (idx + 1);
    let a = document.createElement('a');
    a.href = url;
    a.click();
  }

  // TODO
  // Test controller function duplicate_matching
  // Add frontend button
  // Add URL route to index.html
  app.duplicate_matching = function (idx) {
    const id = app.vue.matchings[idx].id;
    const name = app.vue.matchings[idx].name;
    const description = app.vue.matchings[idx].description;
    const num_classes = app.vue.matchings[idx].num_classes;
    const num_professors = app.vue.matchings[idx].num_professors;
    const num_matches = app.vue.matchings[idx].num_matches;
    const num_quarters = app.vue.matchings[idx].num_quarters;
    const curTime = new Date();
    console.log(`Duplicating matching ${name}`);
    app.vue.matchings.push({
      id: -1,
      _idx: app.vue.matchings.length,
      name: name + ' copy',
      description: description,
      num_classes: num_classes,
      num_professors: num_professors,
      num_matches: num_matches,
      num_quarters: num_quarters,
      created_on: curTime.toString()
    })
    axios.post(duplicate_matching_url, {
      matching_id: id,
      created_on: curTime.toString()
    }).then(function (response) {
      console.log(`Duplicated matching ${name}`);
      if(!app.update_local_matching(name + ' copy', response.data.id)) {
        console.error(`After added matching, unable to add ID ${response.data.id}`);
      }
    }).catch(function (error) {
      console.error(`Error when duplicating matching ${name}:`, error);
      if(!app.remove_local_matching(name + ' copy')) {
        console.error(`Error when un-duplicating matching ${name}, not found`);
      }
    });
  }

  // TODO:
  // Watch editing contacts in place from https://learn-py4web.github.io/unit16.html
  // Write Vue function app.edit_matching
  // Add button
  // Write controller function
  app.edit_matching = function (idx) {

  }

  // Done
  app.delete_matching = function (idx) {
    const id = app.vue.matchings[idx].id;
    const name = app.vue.matchings[idx].name;
    const description = app.vue.matchings[idx].description;
    const num_classes = app.vue.matchings[idx].num_classes;
    const num_professors = app.vue.matchings[idx].num_professors;
    const num_matches = app.vue.matchings[idx].num_matches;
    const num_quarters = app.vue.matchings[idx].num_quarters;
    const created_on = app.vue.matchings[idx].created_on;
    if(id < 0) {
      console.error(`Unable to delete matching ${name} with id ${id}`);
      return;
    }
    if(!app.remove_local_matching(name)){
      console.error(`Error when deleting matching ${name}: Not found`);
      return;
    }

    axios.post(delete_matching_url, {
      id: id
    }).then(function (response) {
      console.log(`Deleted matching ${name}`);
    }).catch(function (error) {
      console.error(`Error when deleting matching ${name}:`, error);
      app.vue.matchings.push({
        id: id,
        _idx: app.vue.matchings.length,
        name: name,
        description: description,
        num_classes: num_classes,
        num_professors: num_professors,
        num_matches: num_matches,
        num_quarters: num_quarters,
        created_on: created_on
      });
    });
  }

  app.set_add_status = (new_status) => {
    app.vue.add_mode = new_status;
  }

  app.methods = {
    add_matching: app.add_matching, // Done
    goto_matching: app.goto_matching, // Done
    edit_matching: app.edit_matching, // TODO
    delete_matching: app.delete_matching, // Done
    duplicate_matching: app.duplicate_matching, // In progress
    set_add_status: app.set_add_status,
    parseDate: app.parseDate
  }

  app.vue = new Vue({
    el: "#vue-target",
    data: app.data,
    methods: app.methods
  });

  app.init = () => {
    axios.get(load_matchings_url).then((response) => {
      app.vue.matchings = app.enumerate(response.data.matchings);
      app.reset_matching_form();
    }).catch(function (error) {
      console.error(`Failed to load matchings:`, error);
    });
  };

  app.init();
};

init(app);