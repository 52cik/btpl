/**
 * @name filters v1.0 过滤器文件，只能配合扩展版使用
 * @author: 楼教主
 * @date: 2015-07-31
 * @site: http://52cik.github.io/btpl/index.html
 * @license: MIT license
 */
(function (filter) {

    /**
     * 字符串转大写
     * @param  {string} str 英文字符串
     * @return {string}
     *
     * @example {{ "ABC" | uppercase }} => abc
     */
    filter("uppercase", function(str) {
        return str.toUpperCase();
    });

    /**
     * 字符串转小写
     * @param  {string} str 英文字符串
     * @return {string}
     *
     * @example {{ "abc" | lowercase }} => ABC
     */
    filter("lowercase", function(str) {
        return str.toLowerCase();
    });

    /**
     * 时间戳格式化，10位时间戳
     * @param  {string} str 10位时间戳
     * @param  {string} fmt 格式化字符串 如 "yyyy-MM-dd hh:mm:ss.S" 得到 2015-7-28 16:07:14.423 
     * @return {string}     日期格式
     *
     * @note 修改自 http://blog.csdn.net/vbangle/article/details/5643091
     *       对Date的扩展，将 Date 转化为指定格式的String
     *       月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
     *       年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
     *
     * @example {{ 1438214400 | data:"yyyy-MM-dd" }} => 2015-07-30
     */
    filter("date", function filter_date(str, fmt) {
        if (0 > (str | 0)) {
            return str; // 保证时间戳大于零
        }
        var dt = new Date(str * 1000);
        var o = {
            "M+": dt.getMonth() + 1, // 月
            "d+": dt.getDate(), // 日
            "h+": dt.getHours(), // 时
            "m+": dt.getMinutes(), // 分
            "s+": dt.getSeconds(), // 秒
            "q+": Math.floor((dt.getMonth() + 3) / 3), // 季度
            "S": dt.getMilliseconds() // 毫秒
        };
        if(/(y+)/.test(fmt))
            fmt=fmt.replace(RegExp.$1, (dt.getFullYear()+"").substr(4 - RegExp.$1.length));
        for(var k in o)
            if(new RegExp("("+ k +")").test(fmt))
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
        return fmt; 
    });
})(bt.filter);