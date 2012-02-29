<script id="js-tmpl-message" type="text/html">
	<li class="message {{#talk}}talk{{/talk}} {{#event}}event{{/event}}" data-owner="{{ownerID}}">
		<div class="name">{{name}}</div>
		<div class="text">
			{{^event}}<div class="bubble">{{/event}}
				{{text}}
			{{^event}}</div>{{/event}}
		</div>
	</li>
</script>

<script id="js-tmpl-user-list-item" type="text/html">
	<li class="user">
		<div class="name">{{name}}</div>
	</li>
</script>

<script id="js-tmpl-image-message" type="text/html">
	<a class="thumbnail" href="{{url}}">
		<img src="{{url}}" />
	</a>
</script>