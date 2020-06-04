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

app.get('/*/*/*', (req, res) =>{
    const lat = parseFloat(req.path.split('/')[1]);
    const lng = parseFloat(req.path.split('/')[2]);
    const year = parseFloat(req.path.split('/')[3]);
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
    for(let agency of agencies){
        console.log(requrl(agency, year));
    }
    console.log(agencies);
    console.log(agencies.length);
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <title>Form Response</title>
        </head>
        <body>
        ${lat} ${lng} ${year}
        </body>
    </html>`);
})

app.listen(port, () => {
    console.log(`listening on port: ${port}`);
});
