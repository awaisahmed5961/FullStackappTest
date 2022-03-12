const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const axios = require('axios');

const cors = require('cors')

app.set('port', (process.env.PORT || 2400));

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(cors())



app.get('/api/v1/balance', (req, res) => {
    res.json({
        "code": 200,
        "data": {
            "balance": process.env.BALANCE
        }
    })
})

app.get('/api/v1/bank/:iban', async (req, res) => {
    try {
        const ibanDetail = await ScrapIBANData(req.params.iban);
        if (ibanDetail.data && ibanDetail.data.data.bank.bank_name == "") {
            res.json({
                "code": 404,
                "error": {
                    "status": "Bad Request",
                    "message": "Bank doesn’t exist"
                }
            }).stauts(404)
        }

        res.json({
            "code": 203,
            "data": {
                "bank": ibanDetail.data.data.bank.bank_name,
                "logo": null,
                "country_code": ibanDetail.data.data.country_code
            }
        }).stauts(203)
    } catch (error) {
        if (error.stauts == 400) {
            res.json({
                "code": 400,
                "error": {
                    "message": "Invalid IBAN Number"
                }
            }).stauts(400)
        }
        res.json({
            "code": 400,
            "error": {
                "message": "Invalid IBAN Number"
            }
        })
    }
})
app.post('/api/v1/transfer/:iban', async (req, res) => {
    const { amount, currency } = req.body;

    try {
        const ibanDetail = await ScrapIBANData(req.params.iban);
        const { data } = ibanDetail
        console.log(amount)
        console.log(currency)
        console.log(process.env.BALANCE)
        if (process.env.BALANCE > amount) {
            res.json({
                "code": 402,
                "error": {
                    "stauts": "Bad Request",
                    "message": "Insufficient funds"
                }
            })
        }

        if (currency != data.data.currency_code) {
            res.json({
                "code": 409,
                "error": {
                    "stauts": "Bad Request",
                    "message": "Currency doesn’t match the associated IBAN country"
                }
            })
        }


        if (data.result == 200 && currency == data.data.currency_code && amount < process.env.BALANCE) {
            process.env.BALANCE = (process.env.BALANCE - amount);
            res.send(process.env.BALANCE)
        }
    } catch (error) {
        if (error.status == 400) {
            res.json({
                "error": {
                    "code": 400,
                    "message": "Invalid IBAN Number"
                }
            }).stauts(400)
        }

        res.json({
            "error": {
                "code": 400,
                "message": "Invalid IBAN Number"
            }
        }).stauts(400)

    }




})



const ScrapIBANData = (Iban) => {
    var FormData = require('form-data');
    var data = new FormData();
    data.append('iban', Iban);
    data.append('api_key', '1acd3fd6fe22992b67677d48c79350984a410c94');
    var config = {
        method: 'post',
        url: 'https://api.ibanapi.com/v1/validate',
        headers: {
            ...data.getHeaders()
        },
        data: data
    };

    return axios(config)

}

app.listen(app.get('port'), () => {
    console.log("server started on port " + app.get('port'))
})