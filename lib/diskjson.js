var observer = require('./observer');
var event = require('eventemitter2').EventEmitter2;
var fs = require('fs');


var all_disks = {};

module.exports.all = all_disks;

function create(path, name, default_val, readable, is_config, no_hotreload, throttle, nobackup) {

    no_hotreload = no_hotreload || false;
    var file = require('path').resolve(path, name + (is_config ? "" : ".data") + ".json");
    if (all_disks[file]) {
        // console.log("reuse", file);
        return all_disks[file];
    }

    function watched_listener(cur, prev) {
        // console.log("reloading")
        load_from_file();
    }

    readable = readable == undefined ? true : readable;
    default_val = default_val || {};
    //wrapping
    var self = {
        data: default_val,
        event: new event({
            wildcard: true
        }),
        reload: load_from_file
        // destroy: dispose_object <-- you may not destroy while running
    };

    if (!no_hotreload) {
        fs.watchFile(file, {
            persistent: false
        }, watched_listener)
    }

    function dispose_object() {
        self.data.unobserve();
    }

    function watch_obj() {
        if (self.data.observe) return;
        self.data = observer.Observable.from(self.data);
        self.data.observe(changes => {
            self.event.emit("observe", changes);
            write_to_file();
        });
    }

    //load once
    function load_from_file() {
        if (!fs.existsSync(file)) {
            write_to_file();
        } else {
            try {
                var new_data = JSON.parse(fs.readFileSync(file).toString());
                var old_keys = Object.keys(self.data);
                var new_keys = Object.keys(new_data);
                var all_keys = [].concat(old_keys, new_keys);
                all_keys.forEach(v => {
                    if (new_keys.indexOf(v) == -1) {
                        delete self.data[v];
                    } else {
                        self.data[v] = new_data[v];
                    }
                });
            } catch (e) {
                console.log(e);
                //read failed
            }
        }
        watch_obj();
    }


    var _last_write = 0;
    var write_throttle = throttle || 1500; //1500ms disk save throttle
    var appointment = 0;
    function write_to_file() {
        //appoint next write at at least 500ms
        var next_to_now = (_last_write + write_throttle) - Date.now();
        clearTimeout(appointment);
        if (next_to_now <= 0) {
            write_to_file_actual();
        }
        else {
            appointment = setTimeout(() => {
                write_to_file_actual()
            }, next_to_now);
        }
    }
    //TODO: throttle write_to_file for better IO
    function write_to_file_actual() {
        var _data_string;
        if (readable) {
            _data_string = JSON.stringify(self.data, "\t", 4);
        } else {
            _data_string = JSON.stringify(self.data);
        }
        if (!nobackup) {
            try {
                if (fs.existsSync(file)) {
                    if (fs.readFileSync(file).toString() != _data_string) {
                        fs.renameSync(file, file + ".bk");
                    }
                }
            } catch (e) {
            }
        }
        try {
            fs.writeFileSync(file, _data_string);
            _last_write = Date.now();
        } catch (e) {
        }
    }

    load_from_file();
    all_disks[file] = self;
    return self;
}


module.exports.create = create;