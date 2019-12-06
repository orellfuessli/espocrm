/************************************************************************
 * This file is part of EspoCRM.
 *
 * EspoCRM - Open Source CRM application.
 * Copyright (C) 2014-2019 Yuri Kuznetsov, Taras Machyshyn, Oleksiy Avramenko
 * Website: https://www.espocrm.com
 *
 * EspoCRM is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * EspoCRM is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EspoCRM. If not, see http://www.gnu.org/licenses/.
 *
 * The interactive user interfaces in modified source and object code versions
 * of this program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU General Public License version 3.
 *
 * In accordance with Section 7(b) of the GNU General Public License version 3,
 * these Appropriate Legal Notices must retain the display of the "EspoCRM" word.
 ************************************************************************/

var exec = require('child_process').exec;

var versionFrom = process.argv[2];

var acceptedVersionName = versionFrom;
var isDev = false;
var isAll = false;

if (process.argv.length > 1) {
    for (var i in process.argv) {
        if (process.argv[i] === '--dev') {
            isDev = true;
        }
        if (process.argv[i] === '--all') {
            isAll = true;
        }
        if (~process.argv[i].indexOf('--acceptedVersion=')) {
            acceptedVersionName = process.argv[i].substr(('--acceptedVersion=').length);
        }
    }
}


if (isAll) {
    var version = (require('./package.json') || {}).version;

    execute('git tag -l --sort=-v:refname # reverse', function (tagsString) {
        var tagList = tagsString.trim().split("\n");
        var versionFromList = [];

        var minorVersionNumber = version.split('.')[1];
        var hotfixVersionNumber = version.split('.')[2];

        for (var i = 0; i < tagList.length; i++) {
            var tag = tagList[i];
            if (!~tag.indexOf('beta') && !~tag.indexOf('alpha')) {
                var minorVersionNumberI = tag.split('.')[1];
                if (minorVersionNumberI !== minorVersionNumber) {
                    versionFromList.push(tag);
                    break;
                }
            }
        }

        if (hotfixVersionNumber !== '0') {
            for (var i = 0; i < tagList.length; i++) {
                var tag = tagList[i];
                if (!~tag.indexOf('beta') && !~tag.indexOf('alpha')) {
                    versionFromList.push(tag);
                    break;
                }
            }
        }

        async function buildMultiple () {
            for (const versionFrom of versionFromList) {
                await buildUpgradePackage(versionFrom, {
                    isDev: isDev,
                });
            }
        }

        buildMultiple();
    });

} else {
    if (process.argv.length < 3) {
        throw new Error("No 'version' specified.");
    }
    buildUpgradePackage(versionFrom, {
        acceptedVersionName: acceptedVersionName,
        isDev: isDev,
    });
}

function buildUpgradePackage(versionFrom, params)
{
    return new Promise(function (resolve) {
        var acceptedVersionName = params.acceptedVersionName || versionFrom;

        var path = require('path');
        var fs = require('fs');
        var sys = require('util');

        var version = (require('./package.json') || {}).version;

        var composerData = require('./composer.json') || {};

        var currentPath = path.dirname(fs.realpathSync(__filename));

        var buildRelPath = 'build/EspoCRM-' + version;
        var buildPath = currentPath + '/' + buildRelPath;
        var diffFilePath = currentPath + '/build/diff';
        var upgradePath = currentPath + '/build/EspoCRM-upgrade-' + acceptedVersionName + '-to-' + version;

        var deleteDirRecursively = function (path) {
            if (fs.existsSync(path)) {
                fs.readdirSync(path).forEach(function(file, index) {
                    var curPath = path + "/" + file;
                    if (fs.lstatSync(curPath).isDirectory()) {
                        deleteDirRecursively(curPath);
                    } else {
                        fs.unlinkSync(curPath);
                    }
                });
                fs.rmdirSync(path);
            }
        };

        deleteDirRecursively(diffFilePath);
        deleteDirRecursively(upgradePath);

        execute('git rev-parse --abbrev-ref HEAD', function (branch) {
            branch = branch.trim();
            if (branch !== 'master' && branch !== 'stable' && branch.indexOf('hotfix/') !== 0) {
                console.log('\x1b[33m%s\x1b[0m', "Warning! You are on " + branch + " branch.");
            }
        });

        execute('git diff --name-only ' + versionFrom, function (stdout) {

            if (!fs.existsSync(upgradePath)) {
                fs.mkdirSync(upgradePath);
            }
            if (!fs.existsSync(upgradePath + '/files')) {
                fs.mkdirSync(upgradePath + '/files');
            }

            if (!fs.existsSync(buildPath)) {
                throw new Error("EspoCRM is not built. Need to run grunt before.");
            }

            process.chdir(buildPath);

            var fileList = [];

            (stdout || '').split('\n').forEach(function (file) {
                if (file == '') {
                    return;
                }
                fileList.push(file);
            });

            fileList.push('client/espo.min.js');
            fileList.push('client/espo.min.js.map');

            fs.readdirSync('client/css/espo/').forEach(function (file) {
                fileList.push('client/css/espo/' + file);
            });

            fs.writeFileSync(diffFilePath, fileList.join('\n'));

            execute('git diff --name-only --diff-filter=D ' + versionFrom, function (stdout) {
                var deletedFileList = [];

                (stdout || '').split('\n').forEach(function (file) {
                    if (file == '') {
                        return;
                    }
                    deletedFileList.push(file);
                });

                execute('xargs -a ' + diffFilePath + ' cp --parents -t ' + upgradePath + '/files ' , function (stdout) {
                    var d = new Date();

                    var monthN = ((d.getMonth() + 1).toString());
                    monthN = monthN.length == 1 ? '0' + monthN : monthN;

                    var dateN = d.getDate().toString();
                    dateN = dateN.length == 1 ? '0' + dateN : dateN;

                    var date = d.getFullYear().toString() + '-' + monthN + '-' + dateN.toString();

                    execute('git tag', function (stdout) {
                        var versionList = [];
                        tagList = stdout.split('\n').forEach(function (tag) {
                            if (tag == versionFrom) {
                                versionList.push(tag);
                            }
                            if (!tag || tag == version) {
                                return;
                            }
                        });

                        if (isDev) {
                            versionList = [];
                        }

                        var name = acceptedVersionName+" to "+version;

                        var manifest = {
                            "name": "EspoCRM Upgrade "+name,
                            "type": "upgrade",
                            "version": version,
                            "acceptableVersions": versionList,
                            "php": [composerData.require.php],
                            "releaseDate": date,
                            "author": "EspoCRM",
                            "description": "",
                            "delete": deletedFileList,
                        };

                        fs.writeFileSync(upgradePath + '/manifest.json', JSON.stringify(manifest, null, '  '));

                        fs.unlinkSync(diffFilePath);

                        console.log("Upgrade package is built: "+name+"");

                        resolve();
                    });

                });
            });
        });
    });
}

function execute(command, callback) {
    exec(command, function(error, stdout, stderr) {
        callback(stdout);
    });
};