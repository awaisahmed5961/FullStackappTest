const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const puppeteer = require('puppeteer-extra');
const cors = require('cors')

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const { val } = require('cheerio/lib/api/attributes');
puppeteer.use(AdblockerPlugin({ blockTrackers: true }))

app.set('port', (process.env.PORT || 2400));

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(cors())

app.use((error, req, res, next) => {
    res.status(error.status || 500).json({
        error: {
            message: "Internal Server Error"
        }
    })
})

app.get('/api/v1/balance', (req, res) => {
    res.json({
        "code": 200,
        "data": {
            "balance": process.env.BALANCE
        }
    })
})

app.get('/api/v1/bank/:iban', async (req, res) => {
    const result = await ValidateIBAN(req.params.iban)
    if (result.code == 203) {
        res.send(result)
    }
    if (result.code == 400) {
        res.sendStatus(400).send(result)
    }
})
app.post('/api/v1/transfer/:iban', async (req, res) => {
    const { amount, currency } = req.body;
    const result = await ValidateIBAN(req.params.iban)
    if (result.code == 203) {

        if (process.env.BALANCE < amount) {
            res.json({
                "code": 402,
                "error": {
                    "stauts": "Bad Request",
                    "message": "Insufficient funds"
                }
            })
        }

        if (currency != 'AED') {
            res.json({
                "code": 409,
                "error": {
                    "stauts": "Bad Request",
                    "message": "Currency doesn’t match the associated IBAN country"
                }
            })
        }

        process.env.BALANCE = (process.env.BALANCE - amount);
        res.send(process.env.BALANCE)

    }
    if (result.code == 400) {
        res.sendStatus(400).send(result)
    }
})




async function ValidateIBAN(IBAN) {

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');

    await page.goto('https://wise.com/sg/iban/checker');
    await page.type('input[id=iban-number]', IBAN);

    await page.evaluate(() => {
        const a = document.querySelector('button[type=submit]').click();
    });
    await page.waitForNavigation();
    const [getError] = await page.$x('//*[@id="main"]/section[1]/div/div/div/form/div/div');
    if (getError) {
        const error = await page.evaluate(name => name.innerText, getError);
        return {
            "code": 400,
            "error": {
                "status": "Bad Request",
                "message": error
            }
        }
    }
    else {
        const [getAccountNumber] = await page.$x('//*[@id="main"]/section[1]/div/div/div[1]/div[2]/h3');
        const accountNumber = await page.evaluate(name => name.innerText, getAccountNumber);
        const [getBankName] = await page.$x('//*[@id="main"]/section[1]/div/div/div[1]/div[2]/p[2]');
        const bankName = await page.evaluate(name => name.innerText, getBankName);
        const [getBankLogo] = await page.$x('//*[@id="main"]/section[1]/div/div/div[1]/div[2]/img');
        const bankLogo = await page.evaluate(name => name.src, getBankLogo);

        return {
            "code": 203,
            "data": {
                "bank": bankName,
                "logo": bankLogo
            }
        }
    }
}
app.listen(app.get('port'), () => {
    console.log("server started on port " + app.get('port'))
})