const Express = require("express")
const { exec } = require('child_process');
const ws = require("ws")

function bootWebServers(seneca, options) {
  return new Promise((resolve, reject) => {
    const { express: expOptions, ws: wsConfig, logToConsole } = options;
    const app = Express();

    app.use(Express.json());

    app.use(Express.static(`${__dirname}/dist`));

    app.get('/', (req, res) => {
      res.sendFile('index.html');
    });

    app.get('/config', (req, res) => {
      return res.status(200).json({
        port: wsConfig.port,
        expressPort: expOptions.port,
      })
    });

    app.post('/toggle', (req, res) => {
      const active = req.query.active || "false"
      seneca.act(`sys:debug,area:trace,active:${active}`, function cb() {
        return res.status(200).json({ ok: true })
      })
    })

    app.post('/toggle-flame', (req, res) => {
      const active = req.query.active || "false"
      seneca.act(`sys:flame,capture:${active}`, function cb() {
        return res.status(200).json({ ok: true });
      })
    })

    app.post('/open-vscode', (req, res) => {
      const { path } = req.body;
      exec(`code -g ${path}`, (err) => {
        if (err) {
          return res.status(500).json({ error: err });
        }
        return res.status(200);
      })
    })

    app.get('/flame-capture-status', (req, res) => {
      seneca.act('sys:flame,cmd:capture_status', function cb(err, cbRes) {
        return res.status(200).json(cbRes);
      })
    })

    const expressApp = app.listen(expOptions.port);

    const wsServer = new ws.Server({
      port: wsConfig.port,
    });

    resolve({ expressApp, wsServer });
  })
  
}

module.exports = {
  bootWebServers,
}