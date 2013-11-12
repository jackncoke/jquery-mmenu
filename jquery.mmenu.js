/*	
 *	jQuery mmenu 3.0.6
 *	
 *	Copyright (c) 2013 Fred Heusschen
 *	www.frebsite.nl
 *
 *	Dual licensed under the MIT and GPL licenses.
 *	http://en.wikipedia.org/wiki/MIT_License
 *	http://en.wikipedia.org/wiki/GNU_General_Public_License
 */


(function( $ ) {


	//	Global nodes
	var $wndw = null,
		$html = null,
		$body = null,
		$page = null,
		$blck = null;

	var $allMenus = null,
		$scrollTopNode = null;


	//	Constants
	var _c, _e, _d;


	$.fn.mmenu = function( opts )
	{
		//	First time plugin is fired
		if ( !$wndw )
		{
			_initPlugin();
		}

		//	Extend options
		opts = extendOptions( opts );

		return this.each(
			function()
			{

				//	STORE VARIABLES
				var $menu 		= $(this),
					_direction	= ( opts.slidingSubmenus ) ? 'horizontal' : 'vertical';

				$allMenus = $allMenus.add( $menu );

				$menu
					.data( _d.options, opts )
					.data( _d.opened, false );

				_serialnr++;


				//	INIT PAGE & MENU
				$page = _initPage( $page, opts.configuration );
				$menu = _initMenu( $menu, opts.position, opts.configuration );
				$blck = _initBlocker( $blck, $menu, opts.configuration );

				_initSubmenus( $menu, _direction, _serialnr );
				_initLinks( $menu, opts.onClick, opts.configuration, opts.slidingSubmenus );
				_initOpenClose( $menu, $page, opts.configuration );

				$.fn.mmenu.counters( $menu, opts.counters, opts.configuration );
				$.fn.mmenu.search( $menu, opts.searchfield, opts.configuration );
				$.fn.mmenu.dragOpen( $menu, opts.dragOpen, opts.configuration );


				//	BIND EVENTS
				var $subs = $menu.find( 'ul' );
				$menu.add( $subs )
					.off( _e.toggle + ' ' + _e.open + ' ' + _e.close )
					.on( _e.toggle + ' ' + _e.open + ' ' + _e.close,
						function( e )
						{
							e.preventDefault();
							e.stopPropagation();
						}
					);

				//	menu-events
				$menu
					.on( _e.toggle,
						function( e )
						{
							return $menu.triggerHandler( $menu.data( _d.opened ) ? _e.close : _e.open );
						}
					)
					.on( _e.open,
						function( e )
						{
							if ( $menu.data( _d.opened ) )
							{
								e.stopImmediatePropagation();
								return false;
							}
							$menu.data( _d.opened, true );
							return openMenu( $menu, opts, opts.configuration );
						}
					)
					.on( _e.close,
						function( e )
						{
							if ( !$menu.data( _d.opened ) )
							{
								e.stopImmediatePropagation();
								return false;
							}
							$menu.data( _d.opened, false );
							return closeMenu( $menu, opts, opts.configuration );
						}
					)
					.off( _e.setPage )
					.on( _e.setPage,
						function( e, $p )
						{
							$page = _initPage( $p, opts.configuration );
							_initOpenClose( $menu, $page, opts.configuration );
						}
					);


				//	submenu-events
				if ( _direction == 'horizontal' )
				{
					$subs
						.on( _e.toggle,
							function( e )
							{								
								return $(this).triggerHandler( _e.open );
							}
						)
						.on( _e.open,
							function( e )
							{
								return openSubmenuHorizontal( $(this), opts );
							}
						)
						.on( _e.close,
							function( e )
							{
								return closeSubmenuHorizontal( $(this), $menu, opts, opts.configuration );
							}
						);
				}
				else
				{
					$subs
						.on( _e.toggle,
							function( e )
							{
								var $t = $(this);
								return $t.triggerHandler( $t.parent().hasClass( _c.opened ) ? _e.close : _e.open );
							}
						)
						.on( _e.open,
							function( e )
							{
								$(this).parent().addClass( _c.opened );
								return 'open';
							}
						)
						.on( _e.close,
							function( e )
							{
								$(this).parent().removeClass( _c.opened );
								return 'close';
							}
						);
				}
			}
		);
	};
	$.fn.mmenu.defaults = {
		position		: 'left',
		slidingSubmenus	: true,
		onClick			: {
			close				: true,
			setSelected			: true,
//			blockUI				: null,
//			callback			: null,
//			setLocationHref		: null,
			delayLocationHref	: true
		},
		configuration	: {
			preventTabbing		: true,
			hardwareAcceleration: true,
			selectedClass		: 'Selected',
			labelClass			: 'Label',
			counterClass		: 'Counter',
			pageNodetype		: 'div',
			menuNodetype		: 'nav',
			transitionDuration	: 400,
			dragOpen			: {
				pageMaxDistance		: 500,
				pageMinVisible		: 65
			}
		}
	};


	$.fn.mmenu.search = function( $m, opts )
	{

		//	Extend options
		if ( typeof opts == 'boolean' )
		{
			opts = {
				add		: opts,
				search	: opts
			};
		}
		else if ( typeof search == 'string' )
		{
			opts = {
				add			: true,
				search		: true,
				placeholder	: opts
			};
		}
		if ( typeof opts != 'object' )
		{
			opts = {};
		}
		opts = $.extend( true, {}, $.fn.mmenu.search.defaults, opts );

		//	Add the field
		if ( opts.add )
		{
			var $s = $( '<div class="' + _c.search + '" />' ).prependTo( $m );
			$s.append( '<input placeholder="' + opts.placeholder + '" type="text" autocomplete="off" />' );

			if ( opts.noResults )
			{
				$('ul', $m).not( '.' + _c.submenu ).append( '<li class="' + _c.noresults + '">' + opts.noResults + '</li>' );
			}
		}

		//	Bind custom events
		if ( opts.search )
		{
			var $s = $('div.' + _c.search, $m),
				$i = $('input', $s);

			var $labels = $('li.' + _c.label, $m),
				$counters = $('em.' + _c.counter, $m),
				$items = $('li', $m)
					.not( '.' + _c.subtitle )
					.not( '.' + _c.label )
					.not( '.' + _c.noresults );

			var _searchText = '> a';
			if ( !opts.showLinksOnly )
			{
				_searchText += ', > span';
			}

			$i.off( _e.keyup + ' ' + _e.change )
				.on( _e.keyup,
					function( e )
					{
						if ( !preventKeypressSearch( e.keyCode ) )
						{
							$i.trigger( _e.search );
						}
					}
				)
				.on( _e.change,
					function( e )
					{
						$i.trigger( _e.search );
					}
				);

			$m.off( _e.reset + ' ' + _e.search )
				.on( _e.reset + ' ' + _e.search,
					function( e )
					{
						e.preventDefault();
						e.stopPropagation();
					}
				)
				.on( _e.reset,
					function( e )
					{
						$i.val( '' );
						$m.trigger( _e.search );
					}
				)
				.on( _e.search,
					function( e, query )
					{
						if ( typeof query == 'string' )
						{
							$i.val( query );
						}
						else
						{
							query = $i.val().toLowerCase();
						}
	
						//	search through items
						$items.add( $labels ).addClass( _c.noresult );
						$items.each(
							function()
							{
								var $t = $(this);
								if ( $(_searchText, $t).text().toLowerCase().indexOf( query ) > -1 )
								{
									$t.add( $t.prevAll( '.' + _c.label ).first() ).removeClass( _c.noresult );
								}
							}
						);
	
						//	update parent for submenus
						$( $('ul.' + _c.submenu, $m).get().reverse() ).each(
							function()
							{
								var $t = $(this),
									$p = $t.data( _d.parent ),
									id = $t.attr( 'id' ),
									$i = $t.find( 'li' )
										.not( '.' + _c.subtitle )
										.not( '.' + _c.label )
										.not( '.' + _c.noresult );
	
								if ( $i.length )
								{
									if ( $p )
									{
										$p.removeClass( _c.noresult )
											.removeClass( _c.nosubresult )
											.prevAll( '.' + _c.label ).first().removeClass( _c.noresult );
									}
								}
								else
								{
									$t.trigger( _e.close );
									if ( $p )
									{
										$p.addClass( _c.nosubresult );
									}
								}
							}
						);

						//	show/hide no results message
						$m[ $items.not( '.' + _c.noresult ).length ? 'removeClass' : 'addClass' ]( _c.noresults );
	
						//	update counters
						$counters.trigger( _e.count );
					}
				);
		}
	};
	$.fn.mmenu.search.defaults = {
		add				: false,
		search			: true,
		showLinksOnly	: true,
		placeholder		: 'Search',
		noResults		: 'No results found.'
	};


	$.fn.mmenu.counters = function( $m, opts, conf )
	{
		//	Extend options
		if ( typeof opts == 'boolean' )
		{
			opts = {
				add		: opts,
				count	: opts
			};
		}
		if ( typeof opts != 'object' )
		{
			opts = {};
		}
		opts = $.extend( true, {}, $.fn.mmenu.counters.defaults, opts );

		//	Refactor counter class
		$('em.' + conf.counterClass, $m).removeClass( conf.counterClass ).addClass( _c.counter );

		//	Add the counters
		if ( opts.add )
		{
			$('.' + _c.submenu, $m).each(
				function()
				{
					var $s = $(this),
						id = $s.attr( 'id' );
	
					if ( id && id.length )
					{
						var $c = $( '<em class="' + _c.counter + '" />' ),
							$a = $('a.' + _c.subopen, $m).filter( '[href="#' + id + '"]' );

						if ( !$a.parent().find( 'em.' + _c.counter ).length )
						{
							$a.before( $c );
						}
					}
				}
			);
		}

		//	Bind custom events
		if ( opts.count )
		{
			$('em.' + _c.counter, $m).each(
				function()
				{
					var $c = $(this),
						$s = $('ul' + $c.next().attr( 'href' ), $m);

					$c.off( _e.count )
						.on( _e.count,
							function( e )
							{
								e.preventDefault();
								e.stopPropagation();
	
								var $lis = $s.children()
									.not( '.' + _c.label )
									.not( '.' + _c.subtitle )
									.not( '.' + _c.noresult )
									.not( '.' + _c.noresults );
	
								$c.html( $lis.length );
							}
						);
				}
			).trigger( _e.count );
		}
	};
	$.fn.mmenu.counters.defaults = {
		add		: false,
		count	: true
	};


	$.fn.mmenu.dragOpen = function( $m, opts, conf )
	{
		if ( !$.fn.hammer )
		{
			return false;
		}


		//	Extend options
		if ( typeof opts == 'boolean' )
		{
			opts = {
				open: opts
			};
		}
		if ( typeof opts != 'object' )
		{
			opts = {};
		}
		opts = $.extend( true, {}, $.fn.mmenu.dragOpen.defaults, opts );


		if ( opts.open )
		{
			var _setup = false,
				_direction = false,
				_distance = 0,
				_maxDistance = 0;

			var pOpts = $m.data( _d.options );

			//	Set up variables
			switch( pOpts.position )
			{
				case 'left':
					var drag = {
						events 		: _e.dragleft + ' ' + _e.dragright,
						open_dir 	: 'right',
						close_dir 	: 'left',
						delta		: 'deltaX',
						negative 	: false
					};
					break;

				case 'right':
					var drag = {
						events 		: _e.dragleft + ' ' + _e.dragright,
						open_dir 	: 'left',
						close_dir 	: 'right',
						delta		: 'deltaX',
						negative 	: true
					};
					break;

				case 'top':
					var drag = {
						events		: _e.dragup + ' ' + _e.dragdown,
						open_dir 	: 'down',
						close_dir 	: 'up',
						delta		: 'deltaY',
						negative 	: false
					};
					break;

				case 'bottom':
					var drag = {
						events 		: _e.dragup + ' ' + _e.dragdown,
						open_dir 	: 'up',
						close_dir 	: 'down',
						delta		: 'deltaY',
						negative 	: true
					};
					break;
			}

			//	Bind events
			$page
				.hammer()
				.on( drag.events + ' ' + _e.dragend,
					function( e )
					{
						e.gesture.preventDefault();
				        e.stopPropagation();
					}
				)
				.on( drag.events,
					function( e )
					{

						var new_distance = drag.negative
							? -e.gesture[ drag.delta ]
							: e.gesture[ drag.delta ];

						_direction = ( new_distance > _distance )
							? drag.open_dir
							: drag.close_dir;

						_distance = new_distance;

						if ( _distance > opts.threshold )
						{
							if ( !_setup )
							{								
								if ( $html.hasClass( _c.opened ) )
								{
									return;
								}
								_setup = true;
								$m.data( _d.opened, true );
								openMenu_setup( $m, pOpts, conf );
								$html.addClass( _c.dragging );

								switch( pOpts.position )
								{
									case 'left':
									case 'right':
										_maxDistance = minMax( $(window).width(), 0, conf.dragOpen.pageMaxDistance ) - conf.dragOpen.pageMinVisible;
										break;
									default:
										_maxDistance = $(window).height() - conf.dragOpen.pageMinVisible;
										break;
								}
							}
							if ( _setup )
							{
								$page.css( 'margin-' + pOpts.position, minMax( _distance, 0, _maxDistance ) );
							}
						}
					}
				)
				.on( _e.dragend,
					function( e )
					{
						if ( _setup )
						{
				        	_setup = false;
							$page.css( 'margin-' + pOpts.position, '' );
							$html.removeClass( _c.dragging );

							if ( _direction == drag.open_dir )
							{
						        openMenu_finish( $m, pOpts, conf );
							}
							else
							{
								$m.data( _d.opened, false );
								closeMenu( $m, pOpts, conf );
							}
						}
				    }
				);
		}
	};
	$.fn.mmenu.dragOpen.defaults = {
		open		: false,
		threshold	: 50
	};


	$.fn.mmenu.useOverflowScrollingFallback = function( use )
	{
		if ( $html )
		{
			if ( typeof use == 'boolean' )
			{
				$html[ use ? 'addClass' : 'removeClass' ]( _c.nooverflowscrolling );
			}
			return $html.hasClass( _c.nooverflowscrolling );
		}
		else
		{
			_useOverflowScrollingFallback = use;
			return use;
		}
	};


	$.fn.mmenu.support = {

		touch: (function() {
			return 'ontouchstart' in window.document;
		})(),

		overflowscrolling: (function() {
			return 'WebkitOverflowScrolling' in window.document.documentElement.style;
		})(),

		oldAndroid: (function() {
			var ua = navigator.userAgent;
			if ( ua.indexOf( 'Android' ) >= 0 )
			{
				return 2.4 > parseFloat( ua.slice( ua.indexOf( 'Android' ) +8 ) );
			}
			return false;
		})(),

		transition: (function() {
			return 'transition' in document.createElement( 'div' ).style;
		})()
	};


	$.fn.mmenu.debug = function( msg )
	{
		if ( typeof console != 'undefined' && typeof console.log != 'undefined' )
		{
			console.log( 'MMENU: ' + msg );
		}
	};
	$.fn.mmenu.deprecated = function( depr, repl )
	{
		if ( typeof console != 'undefined' && typeof console.warn != 'undefined' )
		{
			console.warn( 'MMENU: ' + depr + ' is deprecated, use ' + repl + ' instead.' );
		}
	};


	//	Global vars
	var _serialnr = 0,
		_useOverflowScrollingFallback = $.fn.mmenu.support.touch && !$.fn.mmenu.support.overflowscrolling;


	function extendOptions( o )
	{
		//	string value only
		if ( typeof o == 'string' )
		{
			switch( o )
			{
				case 'top':
				case 'right':
				case 'bottom':
				case 'left':
					o = {
						position: o
					};
					break;
			}
		}
		if ( typeof o != 'object' )
		{
			o = {};
		}


		//	DEPRECATED
		if ( typeof o.addCounters != 'undefined' )
		{
			$.fn.mmenu.deprecated( 'addCounters-option', 'counters.add-option' );
			o.counters = {
				add: o.addCounters
			};
		}
		if ( typeof o.closeOnClick != 'undefined' )
		{
			$.fn.mmenu.deprecated( 'closeOnClick-option', 'onClick.close-option' );
			o.onClick = {
				close: o.closeOnClick
			};
		}
		if ( typeof o.onClick != 'undefined' )
		{
			if ( typeof o.onClick.delayPageload != 'undefined' )
			{
				$.fn.mmenu.deprecated( 'onClick.delayPageload-option', 'onClick.delayLocationHref-option' );
				o.onClick.delayLocationHref = o.onClick.delayPageload;
			}
			if ( typeof o.onClick.delayLocationHref == 'number' )
			{
				$.fn.mmenu.deprecated( 'a number for the onClick.delayLocationHref-option', 'true/false' );
				o.onClick.delayLocationHref = ( o.onClick.delayLocationHref > 0 ) ? true : false;
			}
		}
		if ( typeof o.configuration != 'undefined' )
		{
			if ( typeof o.configuration.slideDuration != 'undefined' )
			{
				$.fn.mmenu.deprecated( 'configuration.slideDuration-option', 'configuration.transitionDuration-option' );
				o.configuration.transitionDuration = o.configuration.slideDuration;
			}
		}
		//	/DEPRECATED


		//	extend onClick
		if ( typeof o.onClick == 'boolean' )
		{
			o.onClick = {
				close	: o.onClick
			};
		}
		else if ( typeof o.onClick != 'object' )
		{
			o.onClick = {};
		}


		//	extend from defaults
		o = $.extend( true, {}, $.fn.mmenu.defaults, o );


		//	set pageSelector
		if ( typeof o.configuration.pageSelector != 'string' )
		{
			o.configuration.pageSelector = '> ' + o.configuration.pageNodetype;
		}

		//	Degration
		if ( $.fn.mmenu.useOverflowScrollingFallback() )
		{
			switch( o.position )
			{
				case 'top':
				case 'bottom':
					$.fn.mmenu.debug( 'position: "' + o.position + '" not possible when using the overflowScrolling-fallback.' );
					o.position = 'left';
					break;
			}
		}

		return o;
	}

	function _initPlugin()
	{
		$wndw = $(window);
		$html = $('html');
		$body = $('body');
		
		$allMenus = $();

		_c = {
			page				: cls( 'page' ),
			blocker				: cls( 'blocker' ),
			blocking			: cls( 'blocking' ),
			opened 				: cls( 'opened' ),
			opening 			: cls( 'opening' ),
			submenu				: cls( 'submenu' ),
			subopen				: cls( 'subopen' ),
			fullsubopen			: cls( 'fullsubopen' ),
			subclose			: cls( 'subclose' ),
			subopened			: cls( 'subopened' ),
			subopening			: cls( 'subopening' ),
			subtitle			: cls( 'subtitle' ),
			selected			: cls( 'selected' ),
			label 				: cls( 'label' ),
			noresult			: cls( 'noresult' ),
			noresults			: cls( 'noresults' ),
			nosubresult			: cls( 'nosubresult' ),
			search 				: cls( 'search' ),
			counter				: cls( 'counter' ),
			accelerated			: cls( 'accelerated' ),
			dragging			: cls( 'dragging' ),
			nooverflowscrolling : cls( 'no-overflowscrolling' )
		};
		_e = {
			toggle			: evt( 'toggle' ),
			open			: evt( 'open' ),
			close			: evt( 'close' ),
			search			: evt( 'search' ),
			reset			: evt( 'reset' ),
			keyup			: evt( 'keyup' ),
			change			: evt( 'change' ),
			keydown			: evt( 'keydown' ),
			count			: evt( 'count' ),
			resize			: evt( 'resize' ),
			opening			: evt( 'opening' ),
			opened			: evt( 'opened' ),
			closing			: evt( 'closing' ),
			closed			: evt( 'closed' ),
			setPage			: evt( 'setPage' ),
			setSelected		: evt( 'setSelected' ),
			transitionend	: evt( 'transitionend' ),
			touchstart		: evt( 'touchstart' ),
			mousedown		: evt( 'mousedown' ),
			click			: evt( 'click' ),
			dragleft		: evt( 'dragleft' ),
			dragright		: evt( 'dragright' ),
			dragup			: evt( 'dragup' ),
			dragdown		: evt( 'dragdown' ),
			dragend			: evt( 'dragend' )
		};
		_d = {
			opened		: dta( 'opened' ),
			options		: dta( 'options' ),
			parent		: dta( 'parent' ),
			sub			: dta( 'sub' ),
			style		: dta( 'style' ),
			scrollTop	: dta( 'scrollTop' ),
			offetLeft	: dta( 'offetLeft' )
		};

		$.fn.mmenu.useOverflowScrollingFallback( _useOverflowScrollingFallback );
	}

	function _initPage( $p, conf )
	{
		if ( !$p )
		{
			$p = $(conf.pageSelector, $body);
			if ( $p.length > 1 )
			{
				$p = $p.wrapAll( '<' + conf.pageNodetype + ' />' ).parent();
			}
		}

		$p.addClass( _c.page );
		return $p;
	}

	function _initMenu( $m, position, conf )
	{
		//	Strip whitespace
		$m.contents().each(
			function()
			{
				if ( $(this)[ 0 ].nodeType == 3 )
				{
					$(this).remove();
				}
			}
		);

		//	Wrap in correct node if needed
		if ( !$m.is( conf.menuNodetype ) )
		{
			$m = $( '<' + conf.menuNodetype + ' />' ).append( $m );
		}

		//	Clone if needed
		if ( conf.clone )
		{
			$m = $m.clone( true );
			$m.add( $m.find( '*' ) ).filter( '[id]' ).each(
				function()
				{
					$(this).attr( 'id', cls( $(this).attr( 'id' ) ) );
				}
			);
		}

		//	Prepend to body
		$m.prependTo( 'body' )
			.addClass( cls( 'menu' ) )
			.addClass( cls( position ) );

		//	Refactor selected class
		$('li.' + conf.selectedClass, $m).removeClass( conf.selectedClass ).addClass( _c.selected );

		//	Refactor label class
		$('li.' + conf.labelClass, $m).removeClass( conf.labelClass ).addClass( _c.label );

		return $m;
	}

	function _initSubmenus( $m, direction, serial )
	{
		$m.addClass( cls( direction ) );

		$( 'ul ul', $m )
			.addClass( _c.submenu )
			.each(
				function( i )
				{
					var $t = $(this),
						$l = $t.parent(),
						$a = $l.find( '> a, > span' ),
						$p = $l.parent(),
						id = $t.attr( 'id' ) || cls( 's' + serial + '-' + i );

					$t.data( _d.parent, $l );
					$l.data( _d.sub, $t );

					$t.attr( 'id', id );

					var $btn = $( '<a class="' + _c.subopen + '" href="#' + id + '" />' ).insertBefore( $a );
					if ( !$a.is( 'a' ) )
					{
						$btn.addClass( _c.fullsubopen );
					}

					if ( direction == 'horizontal' )
					{
						var id = $p.attr( 'id' ) || cls( 'p' + serial + '-' + i );

						$p.attr( 'id', id );
						$t.prepend( '<li class="' + _c.subtitle + '"><a class="' + _c.subclose + '" href="#' + id + '">' + $a.text() + '</a></li>' );
					}
				}
			);

		if ( direction == 'horizontal' )
		{
			//	Add opened-classes
			var $selected = $('li.' + _c.selected, $m);
			$selected
				.add( $selected.parents( 'li' ) )
				.parents( 'li' ).removeClass( _c.selected )
				.end().each(
					function()
					{
						var $t = $(this),
							$u = $t.find( '> ul' );
	
						if ( $u.length )
						{
							$t.parent().addClass( _c.subopened ).addClass( _c.subopening );
							$u.addClass( _c.opened );
						}
					}
				)
				.parent().addClass( _c.opened )
				.parents( 'ul' ).addClass( _c.subopened ).addClass( _c.subopening );

			if ( !$('ul.' + _c.opened, $m).length )
			{
				$('ul', $m).not( '.' + _c.submenu ).addClass( _c.opened );
			}

			//	Rearrange markup
			$('ul ul', $m).appendTo( $m );
		}
		else
		{
			//	Replace Selected-class with opened-class in parents from .Selected
			$('li.' + _c.selected, $m)
				.addClass( _c.opened )
				.parents( '.' + _c.selected ).removeClass( _c.selected );
		}
	}
	function _initBlocker( $b, $m, conf )
	{
		if ( !$b )
		{
			$b = $( '<div id="' + _c.blocker + '" />' ).appendTo( $body );
		}

		click( $b,
			function()
			{
				$m.trigger( _e.close );
			}, true, true
		);
		return $b;
	}
	function _initLinks( $m, onClick, conf, horizontal )
	{

		//	set selected event
		var $lis = $('li', $m)
			.off( _e.setSelected )
			.on( _e.setSelected,
				function()
				{
					$lis.removeClass( _c.selected );
					$(this).addClass( _c.selected );
				}
			);

		//	linking
		var $a = $('a', $m)
			.not( '.' + _c.subopen )
			.not( '.' + _c.subclose )
			.not( '[target="_blank"]' );

		click( $a,
			function()
			{
				var $t = $(this),
					href = $t.attr( 'href' );

				//	set selected item
				if ( boolOrFn( onClick.setSelected, $t ) )
				{
					$t.parent().trigger( _e.setSelected );
				}

				//	block UI
				if ( boolOrFn( onClick.blockUI, $t, href.slice( 0, 1 ) != '#' ) )
				{
					$html.addClass( _c.blocking );
				}

				//	callback + loaction.href + close menu
				var callback			= typeof onClick.callback == 'function',
					callbackFn			= function() { onClick.callback.call( $t[ 0 ] ); }
					close				= boolOrFn( onClick.close, $t ),
					delayLocationHref	= boolOrFn( onClick.delayLocationHref, $t ),
					setLocationHref 	= boolOrFn( onClick.setLocationHref, $t, href != '#' ),
					setLocationHrefFn	= function() { window.location.href = href; };

				var closing = false;

				//	close: use transitionend
				if ( close )
				{
					if ( setLocationHref )
					{
						if ( delayLocationHref )
						{
							transitionend( $page, setLocationHrefFn, conf.transitionDuration );
						}
						else
						{
							setLocationHrefFn();
						}
					}
					if ( callback )
					{
						transitionend( $page, callbackFn, conf.transitionDuration );
					}
					closing = $m.triggerHandler( _e.close );
				}

				//	not close or not closing: no transitionend
				if ( !close || !closing )
				{
					if ( setLocationHref )
					{
						setLocationHrefFn();
					}
					if ( callback )
					{
						callbackFn();
					}
				}
			}
		);


		//	open/close horizontal submenus
		if ( horizontal )
		{
			click( $('a.' + _c.subopen, $m),
				function()
				{
					var $submenu = $(this).parent().data( _d.sub );
					if ( $submenu )
					{
						$submenu.trigger( _e.open );
					}
				}
			);
			click( $('a.' + _c.subclose, $m),
				function()
				{
					$(this).parent().parent().trigger( _e.close );
				}
			);
		}

		//	open/close vertical submenus
		else
		{
			click( $('a.' + _c.subopen, $m),
				function()
				{
					var $submenu = $(this).parent().data( _d.sub );
					if ( $submenu )
					{
						$submenu.trigger( _e.toggle );
					}
				}
			);
		}
	}
	function _initOpenClose( $m, $p, c )
	{
		//	toggle menu
		var id = $m.attr( 'id' );
		if ( id && id.length )
		{
			if ( c.clone )
			{
				id = uncls( id );
			}
			click( $('a[href="#' + id + '"]', $p),
				function()
				{
					$m.trigger( _e.toggle );
				}
			);
		}

		//	close menu
		var id = $p.attr( 'id' );
		if ( id && id.length )
		{
			click( $('a[href="#' + id + '"]', $p),
				function()
				{
					$m.trigger( _e.close );
				}
			);
		}
	}

	function openMenu( $m, o, c )
	{
		openMenu_setup( $m, o, c );

		//	small timeout to ensure the "opened" class did its job
		setTimeout(
			function()
			{
				openMenu_finish( $m, o, c );
			}, 10
		);

		return 'open';
	}
	function openMenu_setup( $m, o, c )
	{
				var _scrollTop = findScrollTop();

		$allMenus.not( $m ).trigger( _e.close );

		//	store style and position
		$page
			.data( _d.style, $page.attr( 'style' ) || '' )
			.data( _d.scrollTop, _scrollTop )
			.data( _d.offetLeft, $page.offset().left );

		//	resize page to window width
		var _w = 0;
		$wndw.off( _e.resize )
			.on( _e.resize,
				function( e )
				{
					var nw = $wndw.width();
					if ( nw != _w )
					{
						_w = nw;
						$page.width( nw - $page.data( _d.offetLeft ) );
					}
				}
			).trigger( _e.resize );

		//	prevent tabbing out of the menu
		if ( c.preventTabbing )
		{
			$wndw.off( _e.keydown )
				.on( _e.keydown,
					function( e )
					{
						if ( e.keyCode == 9 )
						{
							e.preventDefault();
							return false;
						}
					}
				);
		}

		//	open
		$m.addClass( _c.opened );

		if ( c.hardwareAcceleration )
		{
			$html.addClass( _c.accelerated );
		}
		$html
			.addClass( _c.opened )
			.addClass( cls( o.position ) );

		$page.scrollTop( _scrollTop );
	}
	function openMenu_finish( $m, o, c )
	{
		//	callback
		transitionend( $page,
			function()
			{
				//	opened
				$m.trigger( _e.opened );
			}, c.transitionDuration
		);

		//	opening
		$html.addClass( _c.opening );
		$m.trigger( _e.opening );
	}
	function closeMenu( $m, o, c )
	{
		//	callback
		transitionend( $page,
			function()
			{
				$m.removeClass( _c.opened );

				$html.removeClass( _c.opened )
					.removeClass( cls( o.position ) )
					.removeClass( _c.accelerated );

				//	restore style and position
				$page.attr( 'style', $page.data( _d.style ) );
				$wndw.off( _e.resize );
				if ( $scrollTopNode )
				{
					$scrollTopNode.scrollTop( $page.data( _d.scrollTop ) );
				}

				//	closed
				$m.trigger( _e.closed );

			}, c.transitionDuration
		);

		//	closing
		$html.removeClass( _c.opening );
		$wndw.off( _e.keydown );
		$m.trigger( _e.closing );

		return 'close';
	}

	function openSubmenuHorizontal( $submenu, o )
	{
		if ( $submenu.hasClass( _c.opened ) )
		{
			return false;
		}

		$body.scrollTop( 0 );
		$html.scrollTop( 0 );

		$submenu
			.removeClass( _c.subopening )
			.addClass( _c.opened );
		
		var $parent = $submenu.data( _d.parent );
		if ( $parent )
		{
			$parent.parent().addClass( _c.subopening );
		}
		return 'open';
	}
	function closeSubmenuHorizontal( $submenu, $m, o, c )
	{
		if ( !$submenu.hasClass( _c.opened ) )
		{
			return false;
		}

		var $parent = $submenu.data( _d.parent );
		if ( $parent )
		{
			//	callback
			transitionend( $m,
				function()
				{
					$submenu.removeClass( _c.opened );
				}, c.transitionDuration
			);

			$parent.parent().removeClass( _c.subopening );
		}
		return 'close';
	}

	function preventKeypressSearch( c )
	{
		switch( c )
		{
			case 9:		//	tab
			case 16:	//	shift
			case 17:	//	control
			case 18:	//	alt
			case 37:	//	left
			case 38:	//	top
			case 39:	//	right
			case 40:	//	bottom
				return true;
		}
		return false;
	}

	function findScrollTop()
	{
		if ( !$scrollTopNode )
		{
			if ( $html.scrollTop() != 0 )
			{
				$scrollTopNode = $html;
			}
			else if ( $body.scrollTop() != 0 )
			{
				$scrollTopNode = $body;
			}
		}
		return ( $scrollTopNode ) ? $scrollTopNode.scrollTop() : 0;
	}

	function transitionend( $e, fn, duration )
	{
		if ( $.fn.mmenu.support.transition )
		{
			$e.one( _e.transitionend, fn );
		}
		else
		{
			setTimeout( fn, duration );
		}
	}
	function minMax( val, min, max )
	{
		if ( val < min )
		{
			val = min;
		}
		if ( val > max )
		{
			val = max;
		}
		return val;
	}
	function boolOrFn( o, $e, d )
	{
		if ( typeof o == 'function' )
		{
			return o.call( $e );
		}
		if ( typeof o == 'undefined' && typeof d != 'undefined' )
		{
			return d;
		}
		return o;
	}
	function click( $b, fn, onTouchStart, add )
	{
		if ( typeof $b == 'string' )
		{
			$b = $( $b );
		}

		var event = ( onTouchStart )
			? $.fn.mmenu.support.touch
				? _e.touchstart
				: _e.mousedown
			: _e.click;

		if ( !add )
		{
			$b.off( event );
		}
		$b.on( event,
			function( e )
			{
				e.preventDefault();
				e.stopPropagation();

				fn.call( this, e );
			}
		);
	}

	function cls( c )
	{
		return 'mm-' + c;
	}
	function uncls( c )
	{
		if ( c.slice( 0, 3 ) == 'mm-' )
		{
			c = c.slice( 3 );
		}
		return c;
	}
	function evt( e )
	{
		return e + '.mm';
	}
	function dta( d )
	{
		return 'mm-' + d;
	}

})( jQuery );