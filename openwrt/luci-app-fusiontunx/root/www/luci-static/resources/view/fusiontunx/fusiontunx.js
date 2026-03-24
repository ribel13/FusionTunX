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
                if (match) port = match;
            }
            return port;
        }).catch(function () { return '8080'; });
    },

    render: function (port) {
        var url = 'http://' + window.location.hostname + ':' + port;

        // CSS UNTUK TRANSPARANSI HALUS TANPA INVERT (Agar Tulisan Tetap Ada)
        var style = E('style', {}, 
            'iframe { ' +
            '  background: rgba(255, 255, 255, 0.2) !important; ' + // Membuat background putih dashboard jadi tembus pandang 80%
            '  backdrop-filter: blur(8px); ' + // Efek kaca buram
            '  opacity: 0.85 !important; ' + // Seluruh dashboard transparan 85%
            '  border-radius: 15px; ' +
            '  box-shadow: 0 4px 15px rgba(0,0,0,0.3); ' +
            '  mix-blend-mode: multiply; ' + // TRIK: Menghilangkan warna putih agar menyatu dengan wallpaper
            '} ' +
            '.cbi-section { ' +
            '  background: rgba(30, 0, 0, 0.7) !important; ' + // Panel Merah Gelap
            '  backdrop-filter: blur(15px); ' + 
            '  border: 2px solid #ff0000 !important; ' +
            '  border-radius: 15px; padding: 40px !important; ' +
            '} ' +
            'h3 { color: #ff0000 !important; font-weight: 900 !important; text-transform: uppercase; text-shadow: 2px 2px 4px #000; } ' +
            'p { color: #ffffff !important; font-weight: 800 !important; text-shadow: 1px 1px 2px #000; }'
        );
        document.head.appendChild(style);

        var iframe = E('iframe', {
            'src': url,
            'style': 'width: 100%; min-height: 85vh; border: none; display: none;',
            'allowtransparency': 'true'
        });

        var warning = E('div', {
            'class': 'cbi-section',
            'style': 'display: none; text-align: center; margin-top: 50px;'
        }, [
            E('h3', {}, _('Service is Not Running')),
            E('p', { 'style': 'margin: 15px 0 25px;' }, _('The FusionTunX backend service is currently stopped.')),
            E('div', {}, [
                E('button', {
                    'class': 'cbi-button cbi-button-action',
                    'style': 'background: #ff0000 !important; font-weight: 900 !important; border: none !important; border-radius: 8px !important; padding: 10px 30px !important;',
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
                        if (instances[i].running) { running = true; break; }
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
