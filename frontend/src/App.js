import './App.css';
import axios from 'axios'
import { findFlagUrlByIso2Code } from "country-flags-svg";
import { useState, useEffect } from 'react'
import Cue from './Components/Cue';
function App() {
  const [iban, setIban] = useState('');
  const [countryFlag, setCountryFlag] = useState('')
  const [response, setResponse] = useState({});
  const [amount, setAmount] = useState(0);
  const [balance, setBalance] = useState(100000);
  useEffect(() => {
    if (iban.length >= 2) {
      const a = findFlagUrlByIso2Code(iban.split('').slice(0, 2).join(''));
      setCountryFlag(a);
    }

    if (iban.length >= 22) {
      validateIBAN(iban)
    }
  }, [iban])


  function validateIBAN(iban) {
    axios.get(`http://localhost:2400/api/v1/bank/${iban}/`)
      .then(res => {
        setResponse(res.data)
        console.log(res)
      }).catch(err => {
        console.log(err)
      })
  }

  function transferAmount(iban, amount, Currency) {
    axios.post(`http://localhost:2400/api/v1/transfer/${iban}/`, {
      currency: Currency,
      amount: +amount
    })
      .then(res => {
        console.log(res)
        if (res.status === 200) {
          const newBalance = balance - +amount;
          setBalance(newBalance);
          resetForm()
        }
      }).catch(err => {
        console.log(err)
      })
  }

  function resetForm() {
    setAmount(0);
    setBalance(100000)
    setIban('');
    setResponse({})
  }
  return (
    <div className="w-screen h-screen bg-gray-200">
      <div className="overflow-hidden sm:rounded-lg w-5/12 mx-auto">
        <div className="flex mt-4 text-sm text-gray-900 px-2 justify-end">
          <div className="font-bold text-gray-500">Balance</div>
          <div className="flex items-center">
            <span className="ml-2  font-bold">{balance}</span>
          </div>
        </div>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg w-full border-2 mx-auto border-gray-500">

          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <form >

              <div className="component relative">
                <label className="block text-gray-700 text-sm font-bold mb-2" >
                  IBAN
              </label>
                <input
                  value={iban}
                  onChange={(e) => {
                    setIban(e.target.value);
                  }} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="name"
                  type="text"
                  placeholder="AE07 0312 3346 7890 1234 56" />
                <div className="check-icon h-full absolute -top-1 right-0 flex items-center">
                  {
                    response && response.code === 203 && <svg className="text-green-400 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  }
                  {

                    response && response.code === 400 && <svg className="text-red-400 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  }
                </div>
                <div className="flex mt-4 text-sm text-gray-900 justify-between mb-5">
                  <div className="flex items-center">
                    {
                      countryFlag ? <img src={countryFlag} alt="country-flag" width="20px" height="20px" /> : <div></div>

                    }
                    {
                      response && response.code == 203 && <div className="font-bold text-gray-600 pl-1 ml-1">{response.data.bank}</div>
                    }
                  </div>
                  {
                    response.data && response.data.logo && < img src={response.data.logo} alt="bank logo" width="20px" height="20px" />
                  }
                </div>
              </div>
              {
                response && response.code === 203 ? (
                  <>
                    <div className="flex py-2 justify-between ">
                      <div className="flex" >
                        <span className="flex items-center justify-center 
              border border-gray-400 border-r-0 py-2 px-3 text-gray-700  bg-gray text-right">AED</span>
                        <input className="border border-gray-400 p-2
               focus:outline-none text-right"
                          onChange={(e) => {
                            setAmount(e.target.value)
                          }}
                          type="text" placeholder="0.0" />
                      </div>
                      <Cue percent={amount / balance * 100} />
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <a onClick={() => {
                        resetForm();
                      }} className="inline-block align-baseline font-bold text-sm text-gray hover:text-gray-darker" href="#">
                        cancel
                       </a>
                      <button onClick={() => {
                        transferAmount(iban, amount, "AED")
                      }} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
                        Transfer
                      </button>
                    </div>
                  </>
                ) : null
              }

            </form>
          </div>
        </div>
      </div>
    </div >
  );
}

export default App;
