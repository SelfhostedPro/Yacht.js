import { NextApiRequest, NextApiResponse } from 'next';
import { Stream } from 'stream';
import { chunk } from '@types/chunk'
import { servers } from '../servers';
/**
 * Manage Containers
 * @route `/api/container/${server}/${containerId}/${command}`
 * - Used to manage containers by sending a Container ID and Command to be executed.
 * @returns HTTP Status code and a Message after all promises Resolve/Reject
 */
const manageContainers = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = req.query;
  const serverName = slug[0];
  const containerId = slug[1];
  const command = slug[2];

  const container = servers[serverName].getContainer(containerId.toString());
  let resStatus = 200;
  let resMessage = '';
  var sse = false

  try {
    // This throws an error if the container does not exist.
    const containerInfo = await container.inspect();
    if (containerInfo) {
      if (command) {
        switch (command.toLowerCase()) {
          case 'pause': {
            containerInfo.State.Status === 'running' &&
              (await container.pause().then(() => (resMessage = `Container ${containerId} on ${serverName} paused.`)));
            containerInfo.State.Status === 'paused' &&
              (await container
                .unpause()
                .then(() => (resMessage = `Container ${containerId} on ${serverName} unpaused.`)));
            break;
          }
          case 'remove': {
            containerInfo.State.Status === 'running' &&
              (await container.stop().then(async (_) => await container.remove()));
            containerInfo.State.Status === 'exited' && (await container.remove());
            resMessage = `Container ${containerId} on ${serverName} removed.`;
            break;
          }
          case 'start': {
            containerInfo.State.Status === 'exited' &&
              (await container.start().then(() => (resMessage = `Container ${containerId} on ${serverName} started.`)));
            containerInfo.State.Status === 'running' &&
              (await container
                .restart()
                .then(() => (resMessage = `Container ${containerId} on ${serverName} restarted.`)));
            break;
          }
          case 'stop': {
            await container.stop();
            resMessage = `Container ${containerId} on ${serverName} stopped.`;
            break;
          }
          case 'logs': {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'text/event-stream;charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-transform');
            res.setHeader('X-Accel-Buffering', 'no');
            const stream = require('stream');
            var inStream;
            sse = true
            const logStream = new stream.PassThrough();

            logStream.on('data', (chunk: chunk) => {
              res.write(chunk)
            })

            container.logs({
              follow: true,
              stdout: true,
              stderr: true,
            })
            .then(logs => {
              console.log(logs)
              inStream = logs;
              return container.modem.demuxStream(logs, logStream, logStream)
            })

            res.socket?.on('end', e => {
              if (inStream) {
                inStream.destroy()
              }
              logStream.end()
              res.end('done\n')
            })
            // for (let i = 0; i < 5; i++) {
            //   res.write(`data: Hello seq ${i}\n\n`)
            // }
            break;
          }
          default: {
            resStatus = 400;
            resMessage = `Command: '${command}' not found (or supported yet)!`;
          }
        }
      } else {
        resStatus = 200;
        resMessage = JSON.stringify(containerInfo);
      }
    } else {
      resStatus = 400;
      resMessage = `Container '${containerId}' is not running.`;
    }
  } catch (err) {
    resStatus = err.statusCode || 400;
    resMessage = `${err.message}`;
    res.status(resStatus).send(resMessage);
  } finally {
    if (sse === false) {
      res.status(resStatus).send(resMessage);
    } else {
      return
    }
  }
}

export default manageContainers;