import express from "express";
import bodyParser from "body-parser";
import { execaCommand, execaCommandSync } from "execa";

const app = express();
const port = 9801;

app.use(bodyParser.json());

execaCommandSync("chmod +x ./run.sh");
const modelProcess = execaCommand("sh ./run.sh");
let modelDataListener = (data) => {
  console.log(data.toString());
};
modelProcess.stdout.on("data", modelDataListener);
modelProcess.pipeStderr(process.stderr);

app.post("/chat", async (req, res) => {
  const { message } = req.body;
  modelProcess.stdout.removeListener("data", modelDataListener);
  let responseMessage = "";
  modelDataListener = (data) => {
    responseMessage += data.toString();
    if (responseMessage.endsWith("### Instruction:\n\n\n> ")) {
      res.send({
        message: responseMessage.substring(0, responseMessage.length - 21),
      });
    } else if (responseMessage.endsWith("> ")) {
      res.send({
        message: responseMessage.substring(0, responseMessage.length - 2),
      });
    }
  };

  modelProcess.stdout.on("data", modelDataListener);
  modelProcess.stdin.write(message + "\n");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
