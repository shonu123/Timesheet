import React, { useState } from 'react';

const Search = ({ onSearch }) => {
    const [search, setSearch] = useState("");

    const onInputChange = (value) => {
        setSearch(value);
        onSearch(value);
    };
    return (
        <div className="">
            {/* <label>Search : </label> */}
            <input
                type="text"
                className="form-control mx-2 sp-d-inline"
                style={{ width: "240px" }}
                placeholder="Search"
                value={search}
                onChange={e => onInputChange(e.target.value)}
            />
        </div>
    );
};

export default Search;