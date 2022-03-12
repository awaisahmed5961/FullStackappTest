import React from 'react'

function Cue({ percent }) {
    return (
        <div className="cue" style={{
            background: `repeating-conic-gradient(
            from 0deg,
            #85c6fe 0deg ${(percent / 100) * 360}deg,
            #4e99d6 0deg 360deg) `}}>

        </div>
    )
}

export default Cue
