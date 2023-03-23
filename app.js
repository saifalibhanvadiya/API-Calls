const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//GET
const getStates = (eachItem) => {
  return {
    stateId: eachItem.state_id,
    stateName: eachItem.state_name,
    population: eachItem.population,
  };
};

app.get("/states/", async (request, response) => {
  const getstate = `
    SELECT
      *
    FROM
      state`;
  const statessArray = await db.all(getstate);
  response.send(statessArray.map((eachItem) => getStates(eachItem)));
});

// Get state based on iD
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getstate = `
    SELECT
      *
    FROM
      state where state_id = ${stateId}`;
  const statessArray = await db.get(getstate);
  const { state_id, state_name, population } = statessArray;
  response.send({
    stateId: state_id,
    stateName: state_name,
    population: population,
  });
});

// Post disctrict
app.post("/districts/", async (request, response) => {
  const distrctDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = distrctDetails;
  const addDisctict = `INSERT INTO district
  (district_name,state_id,cases,cured,active,deaths)
  VALUES
  ('${districtName}',${stateId},${cases},${cured},${active},${deaths})`;
  await db.run(addDisctict);
  response.send("District Successfully Added");
});

// district
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getstate = `
    SELECT
      *
    FROM
      district where district_id = ${districtId}`;
  const statessArray = await db.get(getstate);
  const {
    district_id,
    district_name,
    state_id,
    cases,
    cured,
    active,
    deaths,
  } = statessArray;
  response.send({
    districtId: district_id,
    districtName: district_name,
    stateId: state_id,
    cases: cases,
    cured: cured,
    active: active,
    deaths: deaths,
  });
});
//

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deletedisctrict = `
    DELETE FROM  district WHERE district_id= ${districtId}`;
  await db.run(deletedisctrict);
  response.send("District Removed");
});

//update
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const distrctDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = distrctDetails;
  const addDisctict = `UPDATE district SET
  district_name = '${districtName}',
  state_id =${stateId},
  cases = ${cases},
  cured = ${cured},
  active = ${active},
  deaths = ${deaths}  WHERE district_id = ${districtId}`;
  await db.run(addDisctict);
  response.send("District Details Updated");
});

//
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getstate = `
    SELECT
      sum(cases),
      sum(cured),
      sum(active),
      sum(deaths)
    FROM
      district where state_id = ${stateId}`;
  const statessArray = await db.all(getstate);
  const s = statessArray[0];
  response.send({
    totalCases: s["sum(cases)"],
    totalCured: s["sum(cured)"],
    totalActive: s["sum(active)"],
    totalDeaths: s["sum(deaths)"],
  });
});

//
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const getstateId = `select state_id from district where district_id = ${districtId}`;
  const getstate = await db.get(getstateId);

  const getName = `select state_name as stateName from state where state_id =${getstate.state_id}`;
  const name = await db.get(getName);
  response.send(name);
});

module.exports = app;
