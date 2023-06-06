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
    hovered_prof_term: {},
    update_dropdown_menu: 0,
    update_dropdown_menu_view3: 0,
    dropdown_hover: false,
    dropdown_hover_view3: false,
    view2_prof_class_quarter: {},
    view3_prof_class_quarter: {},
    
    view_2_data: {},
    // view_2_data is the data used to populate View 2.
    // view_2_data[class ID]. First key is the class ID.
    // view_2_data[class ID][quarter idx]. Second key is the quarter number (0-indexed).
    // view_2_data[class ID][quarter idx] is an array of {id: <professor ID>, name: <professor name>}.

    view_3_data: {},
    // view_3_data is the data used to populate View 3.
    // view_3_data[professor ID]. First key is the professor ID.
    // view_3_data[professor ID][quarter idx]. Second key is the quarter number (0-indexed).
    // view_3_data[professor ID][quarter idx] is an array of {id: <class ID>, name: <class name>}.
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
      else {
        app.vue.view_2_data[response.data.id] = Array.from(Array(app.vue.num_quarters), () => []);
        app.force_update_dropdown_menu();
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

  app.edit_class = function (idx) {
    const id = app.vue.classes[idx].id;
    const name = app.vue.classes[idx].name;
    const num_sections = app.vue.classes[idx].num_sections;
    for (section of num_sections) {
      if (section === '' || !Number.isInteger(Number(section)) || Number(section) < 0 || Number(section) > 99) {
        console.log(`Invalid section input for class ${name} with id ${id}`);
        return;
      }
    }

    axios.post(edit_class_url, {
      id: id,
      num_sections: num_sections
    }).then(function (response) {
      console.log(`Edited class with idx ${idx}`);
    }).catch(function (error) {
      console.error(`Error when editing class with idx ${idx}`, error);
    });
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

      // Rebuild view 2 and view 3 data.
      app.init_view_2_3_data();

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
      else {
        app.vue.view_3_data[response.data.id] = Array.from(Array(app.vue.num_quarters), () => []);
        app.force_update_dropdown_menu();
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

  app.edit_professor = function (idx, idx2) {
    const id = app.vue.professors[idx].id;
    const quarter = idx2;
    const requested_classes =  app.vue.professors[idx].requested_classes[quarter];
    const all_classes = app.vue.classes.map(c => c.id)
    const non_requested_classes = all_classes.filter(c_id => !requested_classes.includes(c_id))
    // console.log(`requested classes: ${requested_classes}`)
    // console.log(`all classes: ${all_classes}`)
    // console.log(`non-requested classes: ${non_requested_classes}`)

    axios.post(edit_professor_url, {
      id: id,
      quarter: quarter,
      requested_classes: requested_classes,
      non_requested_classes: non_requested_classes
    }).then(function (response) {
      console.log(`Edited professor ${app.vue.professors[idx].name}`);
    }).catch(function (error) {
      console.error(`Error when editing professor${app.vue.professors[idx].name}`, error);
    });
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

      // Rebuild view 2 and view 3 data.
      app.init_view_2_3_data();

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
    app.vue.view_2_data[Class.id][Quarter].push({id: Professor.id, name: Professor.name});
    app.vue.view_3_data[Professor.id][Quarter].push({id: Class.id, name: Class.name});
    app.force_update_dropdown_menu();
    app.reset_match_form();
    app.vue.add_match_mode = false;
    axios.post(add_match_url, {
      class_id: Class.id,
      professor_id: Professor.id,
      quarter: Quarter,
      created_on: curTime.toString()
    }).then(function (response) {
      console.log(`Added match: [${Professor.name}, ${Class.name}] in ${app.vue.quarter_names[Quarter]}`);
      if(!app.update_local_match(Class.id, Professor.id, Quarter, response.data.id)) {
        console.error(`After adding match, unable to add ID ${response.data.id}`);
      }
    }).catch(function (error) {
      console.error(`Error when adding match ${Professor.name} & ${Class.name}:`, error);
      if(!app.remove_local_match(Class.id, Professor.id, Quarter)) {
        console.error(`Error when un-adding match ${Professor.name} & ${Class.name}, not found`);
      }
    });
  }

  // Given the match's class id, professor id, and id, update its ID in app.vue.matches
  app.update_local_match = function (class_id, professor_id, quarter, id) {
    for(let i = app.vue.matches.length - 1; i >= 0; i--) {
      if(app.vue.matches[i].class_id === class_id && app.vue.matches[i].professor_id === professor_id && app.vue.matches[i].quarter === quarter) {
        app.vue.matches[i].id = id;
        return true;
      }
    }
    return false;
  }

  // Given the match's class id and professor id, removes it from app.vue.matches, app.vue.view_2_data, and app.vue.view_3_data
  app.remove_local_match = function (class_id, professor_id, quarter) {
    for (let i = app.vue.matches.length - 1; i >= 0; i--) {
      if(app.vue.matches[i].class_id === class_id && app.vue.matches[i].professor_id === professor_id && app.vue.matches[i].quarter === quarter) {
        let match_id = app.vue.matches[i].id;
        if (match_id <= 0) {
          return 0;
        }
        let view_2_idx = app.vue.view_2_data[class_id][quarter].findIndex((p) => p.id === professor_id);
        let view_3_idx = app.vue.view_3_data[professor_id][quarter].findIndex((c) => c.id === class_id);
        if (view_2_idx < 0) {
          console.error(`When deleting match, unable to find match [class #${class_id}, prof #${professor_id}, quarter ${quarter}] in view_2_data`);
          return 0;
        }
        if (view_3_idx < 0) {
          console.error(`When deleting match, unable to find match [class #${class_id}, prof #${professor_id}, quarter ${quarter}] in view_3_data`);
          return 0;
        }
        app.vue.matches.splice(i, 1);
        app.vue.view_2_data[class_id][quarter].splice(view_2_idx, 1);
        app.vue.view_3_data[professor_id][quarter].splice(view_3_idx, 1);
        return match_id;
      }
    }
    return 0;
  }

  // This function is called to delete a match.
  // 'idx' is the index (0-indexed) of the match in app.vue.matches
  app.delete_match_old = function (idx) {
    const class_id = app.vue.matches[idx].class_id;
    const professor_id = app.vue.matches[idx].professor_id;
    const quarter = app.vue.matches[idx].quarter;
    app.delete_match(class_id, professor_id, quarter);
  }

  app.delete_match = function (class_id, professor_id, quarter) {
    if (!(class_id in app.vue.view_2_data)) {
      console.error(`Error: When deleting match, unable to find class ID ${class_id} in view_2_data`);
      return;
    }
    if (!(professor_id in app.vue.view_3_data)) {
      console.error(`Error: When deleting match, unable to find professor ID ${professor_id} in view_3_data`);
      return;
    }
    let match_id = app.remove_local_match(class_id, professor_id, quarter);
    if (match_id <= 0) {
      console.error(`Error: When deleting match, unable to find match [class #${class_id}, professor #${professor_id}, quarter ${quarter}] in matches`);
      return;
    }

    app.force_update_dropdown_menu();

    axios.post(delete_match_url, {
      id: match_id,
    }).then(function (response) {
      console.log(`Deleted match [class #${class_id}, prof #${professor_id}, quarter ${quarter}]`);
      app.force_update_dropdown_menu();
    }).catch(function (error) {
      console.log(`Error when deleting match #${match_id}. Refresh this page.`, error);
    });
  }

  // This function resets the form to add a professor.
  app.reset_match_form = function () {
    app.vue.add_match_class = -1;
    app.vue.add_match_professor = -1;
    app.vue.add_match_quarter = -1;
  }

  // Given app.vue.matches, this function generates the data to be displayed in View 2 and View 3.
  // Specifically, app.vue.matches should be all the matches in this matching.
  // This builds app.vue.view_2_data, which is the data displayed in View 2.
  // This builds app.vue.view_3_data, which is the data displayed in View 3.
  app.init_view_2_3_data = function () {
    app.vue.view_2_data = {};
    app.vue.view_3_data = {};
    let class_id_to_name = {};
    app.vue.classes.forEach((c) => {
      app.vue.view_2_data[c.id] = Array.from(Array(app.vue.num_quarters), () => []);
      class_id_to_name[c.id] = c.name;
    });
    let professor_id_to_name = {};
    app.vue.professors.forEach((p) => {
      app.vue.view_3_data[p.id] = Array.from(Array(app.vue.num_quarters), () => []);
      professor_id_to_name[p.id] = p.name;
    });

    app.vue.matches.forEach((m) => {
      if (!(m.class_id in app.vue.view_2_data)) {
        console.error(`Found a match with class ID ${m.class_id}, which does not exist`);
        return;
      }
      if (!(m.professor_id in app.vue.view_3_data)) {
        console.error(`Found a match with professor ID ${m.professor_id}, which does not exist`);
        return;
      }
      if (m.quarter < 0 || m.quarter >= app.vue.num_quarters) {
        console.error(`Found a match with quarter ${m.quarter}, which does not exist`);
        return;
      }
      app.vue.view_2_data[m.class_id][m.quarter].push({id: m.professor_id, name: professor_id_to_name[m.professor_id]});
      app.vue.view_3_data[m.professor_id][m.quarter].push({id: m.class_id, name: class_id_to_name[m.class_id]});
    });
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

  app.hover_dropdown_menu_view_3 = function(id){
    if (!app.vue.hovered_prof_term[id]){
      app.vue.hovered_prof_term[id] = true;
      app.force_update_dropdown_menu();
    }
  }

  app.unhover_dropdown_menu_view_3 = function(id){
    if (app.vue.hovered_prof_term[id]){
      app.vue.hovered_prof_term[id] = false;
      app.force_update_dropdown_menu();
    }
  }

  app.initialize_hover = function(){
    for(c in app.vue.classes){
      for(q in app.vue.quarter_names){
        app.vue.hovered_class_term[app.vue.classes[c].id + app.vue.quarter_names[q]] = false;
      }
    };

    for(p in app.vue.professors){
      for(q in app.vue.quarter_names){
        app.vue.hovered_prof_term[app.vue.professors[p].id + app.vue.quarter_names[q]] = false;
      }
    };
  }

  app.force_update_dropdown_menu = function(){
    app.vue.update_dropdown_menu += 1;
    app.vue.update_dropdown_menu_view3 += 1;
  }

  app.check_prof_request_quarter_class = function(quarter, class_id, prof){
    const quarter_id = app.get_quarter_id(quarter);
    const req_classes = app.get_requested_classes(prof, quarter_id);
    const key = class_id + quarter;
    // console.log("QuarterID: %i, ClassID: %i, InClassQuarter: %b", quarter_id, class_id, req_classes.includes(class_id))
    if (quarter_id == null){
      return false
    }
    else{
      const prof_requested_class_in_term = req_classes.includes(class_id);

      if(prof_requested_class_in_term){
        if (key in app.vue.view2_prof_class_quarter){
          app.vue.view2_prof_class_quarter[key].push(prof.id);
        }
        else{
          app.vue.view2_prof_class_quarter[key] = [];
          app.vue.view2_prof_class_quarter[key].push(prof.id);
        }
        // console.log(prof.id);
      }

      return prof_requested_class_in_term;
    }
  }

  app.get_quarter_id = function(quarter){
    for (q in app.vue.quarter_names){
      if (quarter == app.vue.quarter_names[q]){
        return q;
      }
    }
    return null;
  }

  app.get_requested_classes = function(professor, classID){
    requested_clases_for_term = []
    for(c in professor.requested_classes[classID]){
      requested_clases_for_term.push(professor.requested_classes[classID][c])
    }
    return requested_clases_for_term
  }

  app.get_drop_profs = function(key){ //returns a tuple of prof_name and prof_id to add to a class_quarter
    drop_professors = [];

    if(key in app.vue.view2_prof_class_quarter){
      for (p in app.vue.professors){
        if(app.vue.view2_prof_class_quarter[key].includes(app.vue.professors[p].id)){
          continue;
        }
        else{
          drop_professors.push([app.vue.professors[p].name, app.vue.professors[p].id]);
        }
      }
    }
    else{
      for (p in app.vue.professors){
        drop_professors.push([app.vue.professors[p].name, app.vue.professors[p].id]);
      }
    }

    return drop_professors;
  }

  app.get_drop_classes = function(key){
    drop_classes = [];

    if(key in app.vue.view3_prof_class_quarter){
      for (c in app.vue.classes){
        if(app.vue.view3_prof_class_quarter[key].includes(app.vue.classes[c].id)){
          continue;
        }
        else{
          drop_classes.push([app.vue.classes[c].name, app.vue.classes[c].id]);
        }
      }
    }
    else{
      for (c in app.vue.classes){
        drop_classes.push([app.vue.classes[c].name, app.vue.classes[c].id]);
      }
    }

    return drop_classes;
  }

  app.add_match_wrapper = function(class_id, quarter, prof_id){
    // console.log(class_id - 1, app.get_quarter_id(quarter), prof_id - 1);
    app.vue.add_match_class = class_id - 1;
    app.vue.add_match_quarter =  app.get_quarter_id(quarter);
    app.vue.add_match_professor = prof_id - 1;
    app.add_match();
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
    delete_match_old: app.delete_match_old,
    hover_dropdown_menu: app.hover_dropdown_menu,
    unhover_dropdown_menu: app.unhover_dropdown_menu,
    hover_dropdown_menu_view_3: app.hover_dropdown_menu_view_3,
    unhover_dropdown_menu_view_3: app.unhover_dropdown_menu_view_3,
    initialize_hover: app.initialize_hover,
    force_update_dropdown_menu: app.force_update_dropdown_menu,
    check_prof_request_quarter_class: app.check_prof_request_quarter_class,
    get_quarter_id: app.get_quarter_id,
    get_requested_classes: app.get_requested_classes,
    get_drop_profs: app.get_drop_profs,
    add_match_wrapper: app.add_match_wrapper,
    get_drop_classes: app.get_drop_classes,
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
      app.init_view_2_3_data();

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