// Turns a simple text file based todo list into a ticker on your panel.
// based on todo applet by Thomas Scott, which was
// Based on Andreas' stock ticker app here:http://cinnamon-spices.linuxmint.com/applets/view/187

// This is first attempt to simplify codepaths, removing the scrolling stuff...
//TODO seems there is mismatched braces somewhere in this code!
// First, we need to import some Libs:
const Main = imports.ui.main;

const Lang = imports.lang;
const Applet = imports.ui.applet;
const GLib = imports.gi.GLib;
const Util = imports.misc.util;
const AppletDir = imports.ui.appletManager.appletMeta['todo@hstubbs3'].path;
const Settings = imports.ui.settings;
// for repeated updating:
const Mainloop = imports.mainloop;

// debug flag
var debug=false;

// in play vars
var currItem=0;
var list = ['Nothing to do'];

//maybe could set debug true if error and add debug ifs / asserts?
var error=false;

function MyApplet(orientation) {
	this._init(orientation);
}

MyApplet.prototype = {
    __proto__: Applet.TextIconApplet.prototype,
	
	_init: function(orientation,instanceId) {        

		// bind settings
		this._preferences = {};
		this.settings = new Settings.AppletSettings(this._preferences, "todo@hstubbs3", instanceId);

		this.settings.bindProperty(Settings.BindingDirection.IN,
                         "text_width",
                         "text_width",
                         this.on_settings_changed,
                         null);

		this.settings.bindProperty(Settings.BindingDirection.IN,
                         "list_editor",
                         "list_editor",
                         this.on_settings_changed,
                         null);

		this._initContextMenu();
	        
		Applet.TextIconApplet.prototype._init.call(this, orientation);

   		try {
			this.set_applet_label("Todo App Starting...");
			// Set the Tooltip-Text
			this.set_applet_tooltip(_("Click to edit the list"));
			this.applet_running=true;
			Main.notify("Todo Applet Started");
	                this.update_todolist();           
		}
        	catch (e) {
        		global.logError(e);
        	}		
	},

	//Configure right click menu -
	_initContextMenu: function () 
	{
        let title_menu_item = new Applet.MenuItem(_("TODO:RENAME APP"), Gtk.STOCK_EDIT, Lang.bind(this, this.on_applet_clicked);
        this._applet_context_menu.addMenuItem(title_menu_item);
        this.out_reader = null;
	},

	// Open the todo list when clicked
	on_applet_clicked: function(event) {
		Util.spawnCommandLine(this._preferences.list_editor + " " + AppletDir + '/todo.list');
	},

	on_applet_removed_from_panel: function(event) { 
		Main.notify("Todo Applet Stopped");
		this.applet_running=false;
		},

	update_todolist: function() {   
		if(currItem==0) { Main.notify("start list again"); }
		// move to the next item
		// grab the file contents 
		// TODO check whether file is updated rather than grabbing every time)
		this.file = AppletDir + '/todo.list';
		if (GLib.file_test(this.file, GLib.FileTest.EXISTS)) {
			let content = GLib.file_get_contents(this.file)
			let todolist =content.toString().split('\n').slice(0,-1);
			// get rid of "true," in the first field
			todolist[0] = todolist[0].replace("true,", "");
			list=todolist;
			} 
		else
			{
			Main.warningNotify("Unable to open todo.list");
			this.set_applet_label("Unable to open todo.list");
			error=true;
			}
		// move to the next item and reset in play vars			
			currItem++;

		// skip invalid, comment and empty items
		while(typeof list[currItem] == 'undefined' || list[currItem].substring(0,1)=="#" || list[currItem] == "") {
			currItem++;
			if(currItem > list.length)
				{
					currItem=0;
				}
			}

		if(currItem > list.length) {	currItem=0;	}

//TODO fix this - never seeing this or further changes... 
		//send notice to OS 
		Main.notify(list[currItem]);

//render all tasks to label
		
		var item=0;
		var tasksLabel='Tasks-'
		for (item=0; item < list.length; item++) {

		while(typeof list[item] == 'undefined' || list[currItem].substring(0,1)=="#" || list[currItem] == "") { item++; }
		if ( item < list.length ) { taskLabel+=' ' + list[item]; }
		}
		
		this.set_applet_label(taskLabel);

		if(this.applet_running) {
			error=false; //clear error code for next run
		Mainloop.timeout_add_seconds(60, Lang.bind(this, this.update_todolist));
			}
        	},
};

function main(metadata, orientation, panel_height, instanceId) {  
    let myApplet = new MyApplet(orientation,instanceId);
    return myApplet;      
}

