import * as React from 'react';
//import Beatloader from 'react-spinners/BeatLoader';
// import FadeLoader from 'react-spinners/FadeLoader';

const Loading = () => {
    return (
        //class : cc-loading , class to apply mask
        <div className="loader-bg">
            <div className='loader'>
                <div><span>Loading</span></div>
                {/* <Beatloader size={15} margin={2} color={"rgb(51 220 186)"}></Beatloader> */}
                
                {/* <FadeLoader height={15} width={5} radius={2} margin={2} color={"rgb(51 220 186)"}></FadeLoader> */}
            </div>
        </div>
    );
};

export default Loading;
