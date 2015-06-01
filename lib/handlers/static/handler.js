/**
 * 静态文件处理器
 */
var fs = require('fs');
var path = require('path');

var Handler = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.configs = self.server.configs;
    self.utils = self.server.require('./core/utils');
};

//处理请求
Handler.prototype.handleRequest = function(context) {
    var self = this;
    try {
        self.handleFileSystem(context);
    } catch (ex) {
        context.responseError(ex.message);
    }
};

//处理文件系统
Handler.prototype.handleFileSystem = function(context) {
    var self = this;
    //处理物理文件
    if (context.request.physicalPathExists) {
        if (context.request.physicalPathType == 'folder') {
            self.writeFolder(context);
        } else {
            self.writeFile(context);
        }
    } else {
        context.responseNotFound();
    }
};

//输出目录
Handler.prototype.writeFolder = function(context) {
    var self = this;
    fs.readdir(context.request.physicalPath, function(err, files) {
        if (err) {
            context.responseError(err);
            return;
        }
        var items = [];
        files.forEach(function(item) {
            var itemPath = path.normalize(context.request.physicalPath + '/' + item);
            var stats = fs.statSync(itemPath); //临时用同步方式
            items.push({
                name: item,
                type: stats.isDirectory() ? 'folder' : 'file'
            });
        });
        var model = {
            server: self.server,
            handler: self,
            request: context.request,
            items: items
        };
        context.responseContent(self.server.responsePages['dir'](model), self.configs.mimeType['.html']);
    });
};

//输出静态文件
Handler.prototype.writeFile = function(context) {
    var self = this;
    fs.readFile(context.request.physicalPath, function(err, data) {
        if (err) {
            context.responseError(err);
        } else {
            context.responseContent(data);
        }
    });
};