var STATS = {
    IO: 0
};

var observer = require('./observer');
var event = require('eventemitter2').EventEmitter2;
var PATH = process.cwd() + '/db/';
var THROTTLE = 100;
var THROTTLE_DUMP = 500;
var fs = require('fs');
try {
    fs.mkdirSync(PATH);
} catch (e) {
    // console.warn("mkdir failed", e);
}

module.exports = function (name, default_val, readable) {

    readable = readable == undefined ? true : readable;
    var self = {
        data: default_val || {},
        event: new event({
            wildcard: true
        })
    };

    var file = PATH + name + ".json";

    var _throttle = 0;

    function throttle(work) {
        clearTimeout(_throttle);
        _throttle = setTimeout(work, THROTTLE);
    }

    function watch_obj() {
        if (self.data.observe) return;
        self.data = observer.Observable.from(self.data);
        self.data.observe(changes => {
            self.event.emit("observe", changes);
            throttle(write_to_file);
        });
    }

    //load once
    function load_from_file() {
        if (!fs.existsSync(file)) {
            write_to_file();
        } else {
            try {
                self.data = JSON.parse(fs.readFileSync(file).toString());
                STATS.IO++;
            } catch (e) {
                //read failed
            }
        }
        watch_obj();
    }

    function write_to_file() {
        var _data_string = JSON.stringify(self.data);
        if (readable) {
            _data_string = JSON.stringify(self.data, "\t", 4);
        }
        try {
            if (fs.existsSync(file)) {
                if (fs.readFileSync(file).toString() != _data_string) {
                    fs.renameSync(file, file + ".bk");
                    STATS.IO++;
                }
            }
        } catch (e) {
            //backup failed
        }
        try {
            fs.writeFileSync(file, _data_string);
            STATS.IO++;
        } catch (e) {
            //write failed
        }
    }

    load_from_file();
    return self;
}

module.exports.dump = function (name, observable_obj, readable) {

    readable = readable == undefined ? true : readable;
    var file = PATH + name + ".dump.json";
    var _throttle = 0;

    function throttle(work) {
        clearTimeout(_throttle);
        _throttle = setTimeout(work, THROTTLE_DUMP);
    }
    observable_obj.observe(changes => {
        throttle(write_to_file);
    });

    function write_to_file() {
        var _data_string = JSON.stringify(observable_obj);
        if (readable) {
            _data_string = JSON.stringify(observable_obj, "\t", 4);
        }
        try {
            fs.writeFileSync(file, _data_string);
            STATS.IO++;
        } catch (e) {
            //write failed
        }
    }
}
module.exports.STATS = STATS;