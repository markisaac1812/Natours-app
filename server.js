const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });


// handle sync errors
process.on("uncaughtException",err=>{
  console.log("unhandled exception Shutting Down");
  console.log(err.name,err.message);
  process.exit(1);
});

const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose.connect(DB).then((con) => {
  // console.log(con.connections);
  console.log('DB connection succfully');
});

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`app running on  port ${port}....`);
});


// errors outsdie express
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  server.close(()=>{
    process.exit(1);
  });
});
