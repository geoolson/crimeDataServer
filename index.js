require('dotenv').config();
const express = require('express');
const cors = require('cors')
const app = express();
const fs = require('fs');
const port = 8080;
const agencyLat = JSON.parse(fs.readFileSync('agencyLat.json', 'utf8'));
const agencyLng = JSON.parse(fs.readFileSync('agencyLng.json', 'utf8'));
const zipCodes = JSON.parse(fs.readFileSync('zipCodes.json', 'utf8'));
const axios = require('axios').default;

const lngRange = 0.2;
const latRange = 0.1;

app.use(cors());

// A Map/dict data structure to cache previous API queries. Keys are the request url
// and the the value is the api payload response.
let apiCache = new Map();


const requrl = (ORI, year) => {
    const apiKey = process.env.API_KEY;
    const url = `https://api.usa.gov/crime/fbi/sapi/api/data/arrest/agencies/offense/`;
    return `${url}${ORI}/monthly/${year}/${year}?API_KEY=${apiKey}`;
};

app.use(express.urlencoded({extended: true}));

app.get('/search/*', (req, res) =>{
    const pathSplit = req.path.split('/');
    const zip = parseInt(pathSplit[2])
    res.json(zipCodes[zip]);
})

app.get('/api/*/*/*', (req, res) => {
    const pathSplit = req.path.split('/');
    const lat = parseFloat(pathSplit[2]);
    const lng = parseFloat(pathSplit[3]);
    const year = parseFloat(pathSplit[4]);
    console.time("execution time");
    const agencies = agencyLat
        .filter((agency) => {
            if (
                agency.latitude < lat + latRange
                && agency.latitude > lat - latRange
                && agency.longitude < lng + lngRange
                && agency.longitude > lng - lngRange
            ) {
                return true;
            }
            else {
                return false;
            }
        })
        .reduce((acc, curr) => {
            return [
                ...acc,
                curr.ori
            ]
        }, []);
    console.timeEnd("execution time");
    let responseData = [];
    for (let agency of agencies) {
        let apiReq = requrl(agency, year);
        if (apiCache.has(apiReq)) {
            responseData = [...responseData, apiCache.get(apiReq)]
            if (responseData.length === agencies.length) {
                res.json(responseData);
            }
        }
        else {
            ((api_req) => {
                axios.get(api_req)
                    .then(response => {
                        responseData = [...responseData, response.data]
                        apiCache.set(api_req, response.data)
                        if (responseData.length === agencies.length) {
                            res.json(responseData);
                        }
                    })
                    .catch(error => {
                        responseData = [...responseData, "error"]
                        if (responseData.length === agencies.length) {
                            res.json(responseData);
                        }
                    })
            })(apiReq);
        }
    }
});

app.listen(port, () => {
    console.log(`listening on port: ${port}`);
});
