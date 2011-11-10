$(function() {
	var loc = location.href;
	var ourLink;
	var menuLinks = document.getElementById('menu').getElementsByTagName('a');
	for (var i = 0; i < menuLinks.length; i++) {
		var link = menuLinks[i];
		if (loc == link.href || (link.innerHTML != "Home" && loc.indexOf(link.href) == 0)) {
			link.parentNode.className = 'selected';
		}
	}
});
