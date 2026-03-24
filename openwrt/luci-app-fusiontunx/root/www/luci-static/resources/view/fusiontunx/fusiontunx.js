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

        // CSS KHUSUS UNTUK TAMPILAN MERAH TEBAL DAN TRANSPARAN
        var style = E('style', {}, 
            '.cbi-section { ' +
            '  background: rgba(30, 0, 0, 0.7) !important; ' + // Panel Merah Gelap Transparan
            '  backdrop-filter: blur(15px); ' + 
            '  border: 2px solid #ff0000 !important; ' +
            '  border-radius: 15px !important; ' +
            '  padding: 50px !important; ' +
            '} ' +
            'h3 { ' +
            '  color: #ff0000 !important; ' + // Tulisan Merah Menyala
            '  font-weight: 900 !important; ' + // Sangat Tebal
            '  font-size: 2.2rem !important; ' +
            '  text-transform: uppercase; ' +
            '  text-shadow: 2px 2px 8px #000; ' +
            '} ' +
            'p { ' +
            '  color: #ffffff !important; ' + // Deskripsi Putih agar kontras
            '  font-weight: 900 !important; ' + // Tebal
            '  font-size: 1.2rem !important; ' +
            '  text-shadow: 1px 1px 3px #000; ' +
            '} ' +
            'iframe { ' +
            '  border-radius: 15px; ' +
            '  background: #ffffff; ' + // Tetap putih agar tulisan dashboard asli terbaca
            '  box-shadow: 0 10px 30px rgba(0,0,0,0.5); ' +
            '}'
        );
        document.head.appendChild(style);

        var iframe = E('iframe', {
            'src': url,
            'style': 'width: 100%; min-height: 85vh; border: none; display: none;',
            'title': 'FusionTunX Dashboard'
        });

        var warning = E('div', {
            'class': 'cbi-section',
            'style': 'display: none; text-align: center; margin-top: 50px;'
        }, [
            E('h3', {}, _('Service is Not Running')),
            E('p', { 'style': 'margin: 20px 0 30px;' }, _('The FusionTunX backend service is currently stopped. Please start the service to access the dashboard.')),
            E('div', {}, [
                E('button', {
                    'class': 'cbi-button cbi-button-action',
                    'style': 'background: #ff0000 !important; color: #fff !important; font-weight: 900 !important; padding: 15px 40px !important; border: none !important; border-radius: 10px !important;',
                    'click': function () {
                        window.location.href = L.url('admin', 'services', 'fusiontunx', 'server');
                    }
                }, _('GO TO SERVER CONTROL'))
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
