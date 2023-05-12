let app = {};

// Creates & initializes a Vue instance
let init = function (app) {
  app.data = {
    matchings: [], // Matchings of the user
    add_matching_name: '', // Name of the matching that the user wants to add
    add_matching_description: '',
    add_matching_num_quarters: 2, // Number of quarters
    add_matching_quarter_names: ['fall', 'spring'], // Names of quarters
    add_mode: false, // Is the user currently adding a matching?
  };

  app.enumerate = function (a) {
    // This adds an _idx field to each element of the array.
    let k = 0;
    a.map((e) => { e._idx = k++; });
    return a;
  };

  app.add_matching = function () {
    const name = app.vue.add_matching_name;
    const description = app.vue.add_matching_description;
    const num_quarters = app.vue.add_matching_num_quarters;
    const quarter_names = app.vue.add_matching_quarter_names;
    if (name === '') {
      console.log('Matching must have name');
      return;
    }
    const curTime = new Date();
    console.log(`Adding matching ${name}`);
    app.vue.matchings.push({
      _idx: app.vue.matchings.length,
      name: name,
      description: description,
      num_classes: 0,
      num_professors: 0,
      num_matches: 0,
      num_quarters: num_quarters,
      quarter_names: quarter_names,
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
      if(!response.ok) {
        throw response;
      }
      console.log(`Added matching ${name}`);
    }).catch(function (error) {
      if('status' in error && error.status / 100 === 2) {
        console.log(`Added matching ${name}`);
        return;
      }
      console.log(`Error when adding matching ${name}: ${JSON.stringify(error)}`);
      if(!app.remove_local_matching(name)) {
        console.log(`Error when un-adding matching ${name}, not found`);
      }
    });
  }

  // Given the name of a matching, removes it from app.vue.matchings
  app.remove_local_matching = function (name) {
    for (let i = app.vue.matchings.length - 1; i >= 0; i--) {
      if (app.vue.matchings[i].name === name) {
        app.vue.matchings.splice(i, 1);
        app.enumerate(app.vue.matchings);
        return true;
      }
    }
    return false;
  }

  app.reset_matching_form = function () {
    app.vue.add_matching_name = `Matching ${app.vue.matchings.length + 1}`;
    app.vue.add_matching_description = '';
    app.vue.add_matching_num_quarters = '';
    app.vue.add_matching_quarter_names = [];
  }

  app.goto_matching = function (idx) {
    let url = goto_matching_url + '/' + (idx + 1);
    let a = document.createElement('a');
    a.href = url;
    a.click();
  }

  // TODO
  // Write controller function duplicate_matching
  // Add frontend button
  // Add URL route to index.html
  app.duplicate_matching = function (idx) {
    const name = app.vue.matchings[idx].name;
    const description = app.vue.matchings[idx].description;
    const num_classes = app.vue.matchings[idx].num_classes;
    const num_professors = app.vue.matchings[idx].num_professors;
    const num_matches = app.vue.matchings[idx].num_matches;
    const num_quarters = app.vue.matchings[idx].num_quarters;
    const quarter_names = app.vue.matchings[idx].quarter_names;
    const curTime = new Date();
    console.log(`Duplicating matching ${name}`);
    app.vue.matchings.push({
      _idx: app.vue.matchings.length,
      name: name + ' copy',
      description: description,
      num_classes: num_classes,
      num_professors: num_professors,
      num_matches: num_matches,
      num_quarters: num_quarters,
      quarter_names: quarter_names,
      created_on: curTime.toLocaleDateString()
    })
    axios.post(duplicate_matching_url, {
      idx: idx,
      created_on: curTime.toString()
    }).then(function (response) {
      if(!response.ok) {
        throw response;
      }
    }).catch(function (error) {
      console.log(`Error when duplicating matching ${name}: ${error}`);
      if(!app.remove_local_matching(name + ' copy')) {
        console.log(`Error when un-duplicating matching ${name}, not found`);
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

  app.delete_matching = function (idx) {
    const name = app.vue.matchings[idx].name;
    const description = app.vue.matchings[idx].description;
    const num_classes = app.vue.matchings[idx].num_classes;
    const num_professors = app.vue.matchings[idx].num_professors;
    const num_matches = app.vue.matchings[idx].num_matches;
    const num_quarters = app.vue.matchings[idx].num_quarters;
    const quarter_names = app.vue.matchings[idx].quarter_names;
    const created_on = app.vue.matchings[idx].created_on;
    if(!app.remove_local_matching(name)){
      console.log(`Error when deleting matching ${name}: Not found`);
      return;
    }

    axios.post(delete_matching_url, {
      idx: idx
    }).then(function (response) {
      if(!response.ok) {
        throw response;
      }
    }).catch(function (error) {
      if('status' in error && error.status / 100 === 2) {
        console.log(`Deleted matching ${name}`);
        return;
      }
      console.log(`Error when deleting matching ${name}: ${JSON.stringify(error)}`)
      app.vue.matchings.push({
        _idx: app.vue.matchings.length,
        name: name,
        description: description,
        num_classes: num_classes,
        num_professors: num_professors,
        num_matches: num_matches,
        num_quarters: num_quarters,
        quarter_names: quarter_names,
        created_on: created_on
      });
    });
  }

  app.set_add_status = (new_status) => {
    app.vue.add_mode = new_status;
  }

  app.methods = {
    add_matching: app.add_matching,
    goto_matching: app.goto_matching,
    edit_matching: app.edit_matching,
    delete_matching: app.delete_matching,
    duplicate_matching: app.duplicate_matching,
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
    }).catch(function (error) {
      console.log(`Failed to load matchings: ${JSON.stringify(error)}`);
    });
  };

  app.init();
};

init(app);