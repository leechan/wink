/**
 * Mini CSS Selector Engine —— wink
 * Copyright (c) 2013 lichen(http://leechan.me/)
 * -------------------------------------------------------
 * Dual licensed under the MIT and GPL licenses.
 *    - http://www.opensource.org/licenses/mit-license.php
 *    - http://www.gnu.org/copyleft/gpl.html
 * -------------------------------------------------------
 */
(function() {
	var simpleSeletor = /^[#\.\w][\w-]+$/,
		idStripper = /#([\w\-_]+)/,
		classStripper = /\.([\w\-_]+)/,
		tagStripper = /^([\w\-_]+)/,
		attrStripper = /\[([\w-]+)=[\"\']?([^\']+)[\"\']?\]$/,
		seletorSplitter = /\S+/g;

	function _(selector, context) {
		if(!selector) return [];

		if(typeof selector === 'string') {
			context = context || document;
			selector = selector.replace(/^\s+|\s+$/g, '');
			if(simpleSeletor.test(selector)) {
				var firstChar = selector.charAt(0),
					type = firstChar === '#' ? 'id' : firstChar === '.' ? 'class' : 'tag';
				return find(type, selector, context);
			}

			if(context.querySelectorAll) {
				return toArray(context.querySelectorAll(selector));
			}

			if(selector.indexOf(',') !== -1) {
				var selectors = selector.split(','),
					ret = [];
				for(var i = 0, len = selectors.length; i < len; i++) {
					ret = ret.concat(_(selectors[i]));
				}
				return unique(ret);
			}

			var split = selector.match(seletorSplitter),
				lastSelector = split.pop(),
				elements = [];

			var id = (lastSelector.match(idStripper) || [])[1],
				className = (lastSelector.match(classStripper) || [])[1],
				tagName = (lastSelector.match(tagStripper) || [])[1],
				attrs = lastSelector.match(attrStripper) || [];

			elements = id && find('id', id, context) || [];
			elements = elements.length ? (className ? filter(elements, className, function(val) {
				return this.className === val;
			}) : elements) : (className ? find('class', className, context) : []);
			elements = elements.length ? (tagName ? filter(elements, tagName, function(val) {
				return this.nodeName.toLowerCase() === val.toLowerCase();
			}) : elements) : (tagName ? find('tag', tagName, context) : []);
			elements = elements.length ? (attrs.length ? filter(elements, attrs, function(attrs) {
				return this.getAttribute(attrs[1]) === attrs[2];
			}) : elements) : (attrs.length ? (filter(find('tag', '*', context), attrs, function(attrs) {
				return this.getAttribute(attrs[1]) === attrs[2];
			})) : []);
	
			if(split.length) {
				return filterByParent(split, elements);
			}
			return elements;
		}

		if(selector.nodeType) {
			return [selector];
		}

		return [];
	}

	function find(type, value, context) {
		var found = [];
		switch(type) {
			case 'id':
				el = document.getElementById(value);
				el && found.push(el);
				break;
			case 'class':
				if(context.getElementsByClassName) {
					found = toArray(context.getElementsByClassName(value));
				} else {
					var all = context.all || context.getElementsByTagName('*');
					for(var i = 0, len = all.length; i < len; i++) {
						var className = all[i].className;
						if(className && RegExp('\\s*' + value + '\\s*', 'g').test(className)) {
							found.push(all[i]);
						}
					}
				}
				break;
			case 'tag':
				found = toArray(context.getElementsByTagName(value));
		}
		return found;
	}

	function toArray(c) {
		try {
            return Array.prototype.slice.call(c);
        } catch(e) {
            var ret = [];
            for (var i = 0, len = c.length; i < len; ++i) {
                ret.push(c[i]);
            }
            return ret;
        }
	}

	function filter(collection, value, fnTest) {
		var ret= [];
		for(var i = 0, len = collection.length; i < len; i++) {
			if(fnTest.call(collection[i], value)) {
				ret.push(collection[i]);
			}
		}
		return ret;
	}

	function filterByParent(selector, elements, dir) {
		var ps = selector.pop(),
			ret = [];
		if(ps === '>') {
			return filterByParent(selector, elements, true);
		}
		var id = (ps.match(idStripper) || [])[1],
			className = (ps.match(classStripper) || [])[1],
			tagName = (ps.match(tagStripper) || [])[1];
			attrs = ps.match(attrStripper) || [];

		for(var i = 0, len = elements.length; i < len; i++) {
			var parent = elements[i].parentNode;
            do {
                var isMatch = !id || (parent.id === id);
                isMatch = isMatch && (!tagName || tagName === parent.nodeName.toLowerCase());
                isMatch = isMatch && (!className || (RegExp('(^|\\s)' + className + '(\\s|$)').test(parent.className)));
                isMatch = isMatch && (!attrs.length || parent.getAttribute(attrs[1]) === attrs[2]);
                if(dir || isMatch) {
                	if(isMatch) {
                		ret.push(elements[i]);
                	}
                	break;
                }
                
            } while ((parent = parent.parentNode))
		}
		return selector.length > 0 ? filterByParent(selector, ret) : ret;
	}

	function unique(arr) {
		var ret = arr.concat();
		for(var i = 0; i < ret.length; i++) {
			for(var j = i + 1; j < ret.length; j++) {
				if(ret[j] === ret[i]) {
					ret.splice(j, 1);
					j--;
				}
			}
		}
		return ret;
	}

	this.wink = _;
})()