/**
 * @name bt v2.0 - 极简极致的JavaScript模板引擎 (扩展版)
 * @author: 楼教主
 * @date: 2015-07-31
 * @site: http://52cik.github.io/btpl/index.html
 * @license: MIT license
 */

(function (global, undefined) {
    /**
     * 全局模板缓存
     * @type {object}
     */
    var cache = {};

    /**
     * 重新编译模板
     * @type {boolean}
     * @note 当配置改变的时候重新编译模板
     */
    var recompile = true;

    /**
     * 构造函数
     * @param {string} tpl 模板数据
     */
    function bt(tpl) {
        var self = this;
        self.tpl = tpl;
        self.parse();
        cache[tpl] = self;
    }

    /**
     * 原型链
     * @type {object}
     */
    var fn = bt.prototype = {
        conf: {
            begin: "{{", // 模板起始标签
            end: "}}", // 模板闭合标签
            varname: "d", // 对象替换符
            strip: true // 忽略空白符
        }
    };

    /**
     * 生成正则 (提升正则性能)
     * @param  {string}
     * @return {regexp}
     */
    function exp(re, opt) {
        return new RegExp(re, opt || "g");
    }

    // HTML实体转义字符
    var ENTITIES = {"<": "&#60;", ">": "&#62;", '"': "&#34;", "'": "&#39;", "/": "&#47;"};

    /**
     * HTML实体转义
     * @param  {string} 要转义的html
     * @return {string} 转义后的html
     */
    fn.encode = function (html) {
        return String(html || '')
            .replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
            .replace(/[<>"'\/]/g, function (k) { return ENTITIES[k] });
    };

    var syntax = fn.syntax = {
        "#": function (str) { // js 语句
            return "';" + str + ";out+='";
        },
        "=": function (str) { // HTML实体转义
            return "'+this.encode(" + apply_filter(str) + ")+'";
        },
        "@": function (str) { // 循环语法
            if ("" === str) { // 循环结束
                return "';}out+='";
            }

            var m, sid = this.sid++;
            if (m = str.match(/\s*([\w."'\][]+)\s*(\w+)\s*(\w+)?/)) {
                var index = m[3] || ("ai" + sid), // 索引
                    value = m[2] || ("av" + sid), // 值
                    length = "al" + sid,
                    arr_name = "arr" + sid;

                str = "';var " + arr_name + "=" + m[1] + "," + index + "=-1," + length + "=" + arr_name + ".length-1," + value + 
                      ";while(" + index + "<" + length + "){" + value + "=" + arr_name + "[" + index + "+=1];out+='";
            }
            return str;
        }
    };

    /**
     * 生成模板引擎函数
     * @return {function} 返回模板函数
     */
    fn.parse = function () {
        var self = this;
        var conf = fn.conf, begin = conf.begin, end = conf.end;
        var REG_BLOCK = exp(begin + "([#=@]|)([\\s\\S]*?|)" + end);
        self.sid = 1; // 迭代变量计次，防止冲突

        var tpl = self.tpl.replace(/'|\\/g, "\\$&");
        tpl = (conf.strip ? tpl.replace(/[\r\n\t]/g, " "):
            tpl.replace(/\r/g, "\\r")
            .replace(/\n/g, "\\n")
            .replace(/\t/g, "\\t"))
            .replace(REG_BLOCK, function (m, type, code) {
                code = (conf.strip ? code : code
                .replace(/(^|[^\\])\\r/g, "$1\r")
                .replace(/(^|[^\\])\\n/g, "$1\n")
                .replace(/(^|[^\\])\\t/g, "$1\t"))
                .replace(/^\s+|\s+$/g, "")
                .replace(/\\('|\\)/g, "$1");
                
                
                if ("" === type && "" === code) { // 不处理
                    return m;
                }

                if (syntax.hasOwnProperty(type)) { // 语法解析
                    return syntax[type].call(self, code);
                }

                return "'+(" + apply_filter(code) + ")+'";
            });

        tpl = "var out='';out+=' " + tpl + " ';return out;";

        try {
            var fnc = new Function(conf.varname, tpl);
            
            var tpl_fnc = self.render = function (data) {
                return fnc.call(self, data); // 指定模版 this 上下文为当前引擎
            }
            
            tpl_fnc.toString = function () { // 输出模版函数
                return fnc.toString();
            }
            
            recompile = false; // 关闭重编译
            return tpl_fnc;
        } catch (e) {
            var error = "该模板不能创建渲染引擎";
            undefined !== console && console.log(error + ": " + tpl);
            // throw e;
            return function () { return error } // 和谐处理错误
        }

    }

    /**
     * 对外公开的bt方法
     * @param  {string} tpl 模板
     * @param  {object} options 配置参数
     * @return {string} 渲染后的html
     */
    function btpl(tpl, options) {
        options || btpl.config(options); // 修改配置
        return recompile ? new bt(tpl) : cache[tpl] || new bt(tpl);
    }

    btpl.ver = 2.0; // 版本号

    /**
     * 配置
     * @param  {object} options 配置参数
     */
    btpl.config = function (options) {
        recompile = true; // 修改配置后重新编译模板

        options = options || {};
        for(var key in options){
            fn.conf[key] = options[key];
        }
    };
    
    /**
     * 多环境支持
     */
    if ("function" === typeof define) { // AMD, CMD, CommonJS 环境
        define(function () { return btpl; } );
    } else if ("object" === typeof module && "object" === typeof module.exports) { // node io 等类似环境
        module.exports = btpl;
    } else { // window 环境
        global.bt = btpl;
    }

    
    /**
     * 过滤器模块
     * @type {object} 过滤器缓存对象
     */
    var filters = fn.filters = {};
    
    /**
     * 注册过滤器
     * @param  {string}   name     过滤器名
     * @param  {function} callback 回调函数
     */
    btpl.filter = function (name, callback) {
        filters[name] = callback;
    }

    // 过滤器正则
    var REG_FILTER = /(\w+)\s*(?::\s*(.+))?$/;

    /**
     * 应用过滤器到模版
     * @param  {string} code 模版数据
     * @return {string}      添加了过滤器的模版
     */
    function apply_filter (code) {
        var val, filter, m;
        // todo 处理 || 性能优化
        val = code.replace(/\|\|/g, "\t"); // 处理 || 符号
        filter = val.split('|'); // 分割滤器
        val = filter[0];

        for (var i=1, l=filter.length; i < l; i++) {
            if (m = filter[i].match(REG_FILTER)) {
                if (filters[m[1]]) { // 过滤器是否存在
                    val = 'this.filters.' + m[1] + '(' + val + (m[2] ? ',' + m[2] : '') + ')';
                } else {
                    val += "| " + filter[2];
                }
            }
        }
        
        return val.replace(/\t/g, "||");;
    }
})(this);