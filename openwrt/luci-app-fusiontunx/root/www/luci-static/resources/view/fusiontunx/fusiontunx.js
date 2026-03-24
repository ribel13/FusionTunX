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

        var style = E('style', {}, `
            @keyframes pulse-violet {
                0% { box-shadow: 0 0 0 0 rgba(142, 45, 226, 0.7); }
                70% { box-shadow: 0 0 0 15px rgba(142, 45, 226, 0); }
                100% { box-shadow: 0 0 0 0 rgba(142, 45, 226, 0); }
            }
            .btn-glow {
                animation: pulse-violet 2s infinite;
            }
        `);
        document.head.appendChild(style);

        var iframe = E('iframe', {
            'src': url,
            'style': 'width: 100%; min-height: 85vh; border: none; display: none; ' +
                     'background: rgba(0, 0, 0, 0.2); backdrop-filter: blur(5px); ' +
                     'border-radius: 15px; opacity: 0.92; ' +
                     'box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);',
            'allowtransparency': 'true',
            'title': 'FusionTunX Dashboard'
        });

        var warning = E('div', {
            'class': 'cbi-section',
            'style': 'display: none; text-align: center; margin-top: 50px; padding: 40px; ' +
                     'background: rgba(20, 10, 40, 0.5); backdrop-filter: blur(15px); ' +
                     'border: 1px solid rgba(142, 45, 226, 0.3); border-radius: 20px;'
        }, [
            E('h3', { 
                'style': 'color: #e0aaff; font-size: 1.8rem; font-weight: 900; text-shadow: 2px 2px 4px rgba(0,0,0,0.6);' 
            }, _('Service is Not Running')),
            
            E('p', { 
                'style': 'margin: 20px 0 30px; font-weight: 800; color: #ffffff; font-size: 1.1rem; text-shadow: 1px 1px 3px rgba(0,0,0,0.8);' 
            }, _('The FusionTunX backend service is currently stopped.')),
            
            E('div', {}, [
                E('button', {
                    'class': 'cbi-button cbi-button-action btn-glow', // Menambahkan class animasi
                    'style': 'background: linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%); ' +
                             'border: none; padding: 14px 35px; border-radius: 12px; ' +
                             'font-weight: 900; color: #fff; cursor: pointer; ' +
                             'text-transform: uppercase; letter-spacing: 1px;',
                    'click': function () {
                        window.location.href = L.url('admin', 'services', 'fusiontunx', 'server');
                    }
                }, _('Go to Server Control'))
            ])
        ]);

        var container = E('div', { 'style': 'background: transparent; padding: 15px;' }, [warning, iframe]);

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

    handleSave: null,
    handleSaveApply: null,
    handleReset: null
});
