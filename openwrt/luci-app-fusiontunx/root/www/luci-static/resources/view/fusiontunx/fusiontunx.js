'use strict';
'require view';
'require fs';
'require ui';
'require rpc';
'require poll';

var callServiceList = rpc.declare({
    object: 'service',
    method: 'list',
    params: ['name'],
    expect: { '': {} }
});

return view.extend({
    load: function () {
        return fs.read('/etc/fusiontunx/app.yaml').then(function (content) {
            var port = '8080';
            if (content) {
                var match = content.match(/port:\s*["']?(\d+)["']?/);
                if (match) port = match[1];
            }
            return port;
        }).catch(function () { return '8080'; });
    },

    render: function (port) {
        var url = 'http://' + window.location.hostname + ':' + port;

        // CSS KHUSUS UNTUK MEMAKSA DASHBOARD MENJADI TRANSPARAN & MERAH
        var style = E('style', {}, 
            'iframe { ' +
            '  background: transparent !important; ' +
            '  filter: invert(1) hue-rotate(180deg) opacity(0.8) contrast(1.2); ' + // MEMBALIK WARNA: Putih jadi Gelap, Biru jadi Merah
            '  mix-blend-mode: screen; ' + // Membuat area gelap menjadi tembus pandang ke wallpaper
            '  border-radius: 15px; ' +
            '} ' +
            '.cbi-section { ' +
            '  background: rgba(40, 0, 0, 0.6) !important; ' +
            '  backdrop-filter: blur(10px); ' +
            '  border: 2px solid #ff0000 !important; ' +
            '  border-radius: 15px; ' +
            '} ' +
            'h3 { color: #ff0000 !important; font-weight: 900 !important; text-transform: uppercase; text-shadow: 2px 2px 4px #000; } ' +
            'p { color: #ff9999 !important; font-weight: 800 !important; }'
        );
        document.head.appendChild(style);

        var iframe = E('iframe', {
            'src': url,
            'style': 'width: 100%; min-height: 85vh; border: none; display: none;',
            'allowtransparency': 'true',
            'title': 'FusionTunX Dashboard'
        });

        var warning = E('div', {
            'class': 'cbi-section',
            'style': 'display: none; text-align: center; margin-top: 50px; padding: 40px;'
        }, [
            E('h3', {}, _('Service is Not Running')),
            E('p', { 'style': 'margin: 15px 0 25px;' }, _('The FusionTunX backend service is currently stopped.')),
            E('div', {}, [
                E('button', {
                    'class': 'cbi-button cbi-button-action',
                    'style': 'background: #ff0000 !important; font-weight: bold;',
                    'click': function () {
                        window.location.href = L.url('admin', 'services', 'fusiontunx', 'server');
                    }
                }, _('Go to Server Control'))
            ])
        ]);

        var container = E('div', { 'style': 'background: transparent;' }, [warning, iframe]);

        var updateStatus = function () {
            return callServiceList('fusiontunx').then(function (res) {
                var running = false;
                try {
                    var instances = res.fusiontunx.instances;
                    for (var i in instances) {
                        if (instances[i].running) {
                            running = true;
                            break;
                        }
                    }
                } catch (e) { }

                if (running) {
                    if (iframe.style.display === 'none') {
                        warning.style.display = 'none';
                        iframe.style.display = 'block';
                        iframe.src = iframe.src;
                    }
                } else {
                    if (warning.style.display === 'none') {
                        iframe.style.display = 'none';
                        warning.style.display = 'block';
                    }
                }
            });
        };

        updateStatus();
        poll.add(updateStatus, 3);
        return container;
    },
    handleSave: null, handleSaveApply: null, handleReset: null
});
