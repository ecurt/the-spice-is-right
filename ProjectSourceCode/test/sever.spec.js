// ********************** Initialize server **********************************


const app = require('../index'); //TODO: Make sure the path to your index.js is correctly added
let server;
// ********************** Import Libraries ***********************************


const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
let agent;
const {assert, expect} = chai;


before((done)=>{
  server = app.listen("3000");
  agent = chai.request.agent(server);
  done();
})


after((done) => { server.close(() => { console.log('Test server closed'); done(); }); });


// ********************** DEFAULT WELCOME TESTCASE ****************************


describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
      agent
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});


// *********************** TODO: WRITE 2 UNIT TESTCASES **************************


// ********************************************************************************
//TEST CASE FOR REGISTER
describe('Testing Add User API', () => {
    it('positive : /register', done => {


        agent
        .post('/register')
        .send({username: 'Nine Critchepon Chuenchit', password: 'Anushi20040925!!'})
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });
   
    it('Negative : /register. Checking invalid name', done => {
          agent
          .post('/register')
          .send({username: 10, password: 'Anushi20040925!!'})
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.message).to.equals('Invalid input');
            done();
          });
    });
  });
//TEST ON LOGIN!!
  describe('Testing Login User API', () => {
    it('positive : /login', done => {
      agent
        .post('/login')
        .send({username: 'Nine Critchepon Chuenchit', password: 'Anushi20040925!!'})
        .end((err, res) => {
          expect(res).to.have.status(200);
          //expect(res.body.message).to.equals('Success');
          done();
        });
    });
   
    it('Negative : /login. Checking invalid name', done => {
      agent
          .post('/login')
          .send({username: 10, password: 'Anushi20040925!!'}) //db error expected due to username being 10, don't panic
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.message).to.equals('Invalid input');
            done();
          });
    });
  });


  describe('Testing cookbook API', () => {
    //does it work if not empty string
    it('positive : /cookbook', done => {
      agent
        .post('/cookbook')
        .send({name:"cookbook1"})
        .end((err, res) => {
          expect(res).to.have.status(200);
          //expect(res.body.message).to.equals('Success');
          done();
        });
    });
    //making sure
    it('Negative : /cookbook. Checking no input', done => {
      agent
        .post('/login')
        .send({username: "",})
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equals('Invalid input');
          done();
        });
    });
  });


  describe('Testing addrecipe API', () => {
    it('positive : /addRecipe', done => {
      agent
        .post('/addRecipe')
        .send({name:"test", description:"test",difficulty:3,time:5,ingredients:"adsfasdfasdf",instructions:"adfasdfasdf"})
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });
    it('Negative : /addRecipe. Checking invalid input', done => {
      agent
        .post('/addRecipe')
        .send({name:"a",description:"a",difficulty:"a",time:"a",ingredients:"a",instructions:"a"})
        .end((err, res) => {
          expect(res).to.have.status(500);
          expect(res.body.message).to.equals('Failed to create recipe');
          done();
        });
    });
  });
