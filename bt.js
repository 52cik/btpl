/**
 * @name bt v1.1 - 极简极致的 JavaScript 模板引擎
 * @author: 楼教主
 * @date: 2015-06-29
 * @site: https://github.com/52cik/btpl
 * @license: MIT license
 */

(function (undefined) {
    /**
     * 构造函数
     * @param {string} tpl 模板数据
     */
    function bt(tpl) { this.tpl = tpl; }

    /**
     * 原型链
     * @type {object}
     */
    var fn = bt.prototype = {};

    /**
     * 生成正则
     * @param  {string}
     * @return {regexp}
     */
    function exp(re) {
        return new RegExp(re, "g");
    }

    /**
     * 正则表达式
     * @type {array}
     */
    var re = fn.re = [
        /* 0 */ exp("\\{\\{([#=]?)([\\s\\S]+?)\\}\\}"), // 匹配 {{ }}
        /* 1 */ exp("[\\r\\n\\t]"), // 换行回车tab
        /* 2 */ exp("\\\\"), // \\
        /* 3 */ exp("(?=\"|')"), // 引号
        /* 4 */ exp("&(?!#?[a-zA-Z0-9]+;)"), // & 符号
        /* 5 */ exp("[<>\"'/]") // <>"'/ 符号
    ];
    

    // HTML实体转义字符
    var rp = { "<": "&#60;", ">": "&#62;", '"': "&#34;", "'": "&#39;", "/": "&#47;" };
    /**
     * HTML实体转义
     * @param  {string} 要转义的html
     * @return {string} 转义后的html
     */
    var encode = function (html) {
        return String(html||'').replace(re[4], '&amp;').replace(re[5], function (k) { return rp[k]; });
    };

    /**
     * 带缓存渲染
     * @param  {object} 待渲染的数据
     * @return {string} 渲染后的html
     */
    fn.render = function (data) {
        var fn = this.parse();
        return (this.render = function (data) {
            return fn(data, encode);
        })(data);
    };


    /**
     * 生成模板引擎函数
     * @return {function} 返回模板函数
     * 
     * @note 生成的引擎如果含有html转义的，需要传入转义函数
     */
    fn.parse = function () {
        var tpl = this.tpl.replace(re[1], "")
        .replace(re[2], "\\\\")
        .replace(re[3], "\\")
        .replace(re[0], function (m, type, code) {
            code = code.replace(re[2], '');
            if ("#" === type) { // js 语句解析
                return "';" + code + ";v+='";
            } else if ("=" === type) { // 转义语句
                return "'+_e_(" + code + ")+'";
            } else { // 普通字符串
                return "'+(" + code + ")+'";
            }
        });

        try {
            return new Function("d, _e_", "var v='';v+=' " + tpl + " ';return v;");
        } catch (e) {
            undefined !== console && console.log("该模板不能创建渲染函数: " + tpl);
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
    
    /**
     * 版本
     */
    btpl.ver = 1.1
    
    /**
     * 多环境支持
     */
    if ("function" == typeof define) { // AMD, CMD, CommonJS 环境
        define(function () { return btpl; } );
    } else if ("object" === typeof module && "object" === typeof module.exports) { // nodejs 等类似环境
        module.exports = btpl;
    } else { // window 环境
        window.bt = btpl;
    }
})();