import * as React from 'react';
// import logo from '../Images/logo.jpg'
//import Beatloader from 'react-spinners/BeatLoader';
// import FadeLoader from 'react-spinners/FadeLoader';

const Loading = () => {
    return (
        //class : cc-loading , class to apply mask
        <div className="loader-bg">
            <div className='loader'>
                <div><img src={require('../Images/logo.jpg')} alt="" className='SynergyLogo'/></div>

                {/* <Beatloader size={15} margin={2} color={"rgb(51 220 186)"}></Beatloader> */}
                
                {/* <FadeLoader height={15} width={5} radius={2} margin={2} color={"rgb(51 220 186)"}></FadeLoader> */}
            </div>
            {/* <span color='#000'>Loading...</span> */}
        </div>
    );
};

export default Loading;
