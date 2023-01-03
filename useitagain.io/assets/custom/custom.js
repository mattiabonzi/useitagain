$(document).ready(function() {
	$(document).languageDetection({
    domain : window.location.protocol+'//'+window.location.host+'/',
    expires: 100,
		languages   :   [
			{
				code : 'en',
				path : '',
				defaultLanguage : true
			},
			{
				code : 'it',
				path : 'it'
			}
		]	
	});
});

