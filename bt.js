/**
 * @name bt v1.3 - 极简极致的JavaScript模板引擎
 * @author: 楼教主
 * @date: 2015-06-30
 * @site: https://github.com/52cik/btpl
 * @license: MIT license
 */

(function (global, undefined) {
    "use strict";

    /**
     * 构造函数
     * @param {string} tpl 模板数据
     */
    function bt(tpl) { this.tpl = tpl; }

    /**
     * 原型链
     * @type {object}
     */
    var fn = bt.prototype = {
        conf: {
            begin: "{{", // 模板起始标签
            end: "}}", // 模板闭合标签
            varname: "d" // 对象替换符
        }
    };

    /**
     * 生成正则 (提升正则性能)
     * @param  {string}
     * @return {regexp}
     */
    function exp(re, opt) {
        opt = undefined === opt ? "g" : opt;
        return new RegExp(re, opt);
    }

    
    var NONE_STR = ""; // 空字符串
    
    /**
     * 正则表达式
     */
    var REG_BLOCK        = exp(fn.conf.begin + "([#=@]|)([\\s\\S]*?|)" + fn.conf.end); // 匹配 {{ }}
    var REG_TAB          = exp("[\\r\\n\\t]"); // 换行回车tab
    var REG_BACKSLASH    = exp("\\\\"); // \\ 
    var REG_QUOT         = exp("(?=\"|')"); // 引号
    var REG_AMP          = exp("&(?!#?[a-zA-Z0-9]+;)"); // & 符号
    var REG_ENTITIES     = exp("[<>\"'/]"); // <>"'/ 符号
    var REG_SYNTAX_FOR   = exp("\\s*([\\w.\"'\\][]+)\\s*(\\w+)?\\s*(\\w+)?", NONE_STR); // for 循环语法
    
    // HTML实体转义字符
    var ENTITIES = { "<": "&#60;", ">": "&#62;", '"': "&#34;", "'": "&#39;", "/": "&#47;" };

    /**
     * HTML实体转义
     * @param  {string} 要转义的html
     * @return {string} 转义后的html
     */
    fn.encode = function (html) {
        return String(html || '')
            .replace(REG_AMP, '&amp;')
            .replace(REG_ENTITIES, function (k) {
                return ENTITIES[k];
            });
    };

    // todo 全局缓存
    // var cache = {};
    /**
     * 带缓存渲染
     * @param  {object} 待渲染的数据
     * @return {string} 渲染后的html
     */
    fn.render = function (data) {
        var self = this;
        var fn = self.parse();
        return (self.render = function (data) {
            return fn.call(self, data); // 指定模版 this 上下文为当前引擎
        })(data);
    };

    /**
     * 语法解析
     * @type {object} 每个属性都是一个语法解析器
     */
    var syntax = fn.syntax = {
        "#": function (str) { // js 语句
            return "';" + str + ";out+='";
        },
        "=": function (str) { // HTML实体转义
            return "'+this.encode(" + apply_filter(str) + ")+'";
        },
        "@": function (str) { // 循环语法
            if (NONE_STR === str) { // 循环结束
                return "';}out+='";
            }
            var m;
            if (m = str.match(REG_SYNTAX_FOR)) {
                var index = "i", value = "val", length = "len";
                if (m[2]) { // 值
                    value = m[2];
                }
                if (m[3]) { // 索引
                    index = m[3];
                }
                str = "';var arr=" + m[1] + "," + index + "=-1," + length + "=arr.length-1," + value + 
                      ";while(" + index + "<" + length + "){" + value + "=arr[" + index + "+=1];out+='";
            }
            return str;
        }
    };

    /**
     * 生成模板引擎函数
     * @return {function} 返回模板函数
     */
    fn.parse = function () {
        var tpl = this.tpl.replace(REG_TAB, NONE_STR)
        .replace(REG_BACKSLASH, "\\\\")
        .replace(REG_QUOT, "\\")
        .replace(REG_BLOCK, function (m, type, code) {
            if (NONE_STR !== code) {
                code = code.replace(REG_BACKSLASH, NONE_STR);
            }

            if (syntax.hasOwnProperty(type)) { // 语法解析
                return syntax[type](code);
            }

            // 普通字符串
            return "'+(" + apply_filter(code) + ")+'";
        });
        
        try {
            return new Function(fn.conf.varname, "var out='';out+=' " + tpl + " ';return out;");
        } catch (e) {
            undefined !== console && console.log("该模板不能创建渲染引擎: " + tpl);
            throw e;
        }
    }

    /**
     * 对外公开的bt方法
     * @param  {string} tpl 模板
     * @return {string} 渲染后的html
     */
    function btpl(tpl) {
        return new bt(tpl);
    }

    btpl.ver = 1.3; // 版本号

    /**
     * 配置
     * @type {object}
     */
    btpl.conf = fn.conf;
    
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
        apply_filter = _apply_filter; // 开启过滤器
    }

    // 过滤器正则
    var REG_FILTER = exp("(\\w+)\\s*(?::\\s*(.+))?$", NONE_STR);

    /**
     * 应用过滤器到模版
     * @param  {string} code 模版数据
     * @return {string}      添加了过滤器的模版
     */
    function _apply_filter (code) {
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
    
    /**
     * 默认过滤器，什么都不做
     * 当添加过滤器后才会应用 _apply_filter 过滤器
     * @param  {string} str
     * @return {string}
     */
    function apply_filter(str) {
        return str
    }
})(this);