require('dotenv').config();
const express = require('express');
const app = express();
const fs = require('fs');
const port = 8080;
const agencyLat = JSON.parse(fs.readFileSync('agencyLat.json', 'utf8'));
const agencyLng = JSON.parse(fs.readFileSync('agencyLng.json', 'utf8'));
const axios = require('axios').default;

const lngRange = 0.2;
const latRange = 0.1;

const apiKey = process.env.API_KEY;
const requrl = (ORI, year) => {
    const url = `https://api.usa.gov/crime/fbi/sapi/api/data/arrest/agencies/offense/`;
    return `${url}${ORI}/monthly/${year}/${year}?API_KEY=${apiKey}`;
};

app.use(express.urlencoded({extended: true}));

app.get('/api/*/*/*', (req, res) =>{
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
            else
            {
                return false;
            }
        })
        .reduce((acc, curr) =>{
            return [
                ...acc,
                curr.ori
            ]
        }, []);
    console.timeEnd("execution time");
    let responseData = [];
    for(let agency of agencies){
        axios.get(requrl(agency, year))
            .then( response => {
                responseData = [...responseData, response.data]
                if(responseData.length === agencies.length){
                    res.json(responseData);
                }
            })
            .catch( error => {
                responseData = [...responseData, "error"]
                if(responseData.length === agencies.length){
                    res.json(responseData);
                }
            })
    }
})

app.listen(port, () => {
    console.log(`listening on port: ${port}`);
});
