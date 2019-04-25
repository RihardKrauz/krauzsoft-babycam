import React from 'react';

const ModeLayout = ({ history }) => {
    function moveToCamView() {
        history.push('/cam');
    }
    function moveToWatcherView() {
        history.push('/watcher');
    }
    return (
        <div>
            <div onClick={moveToCamView}>Im a new cam</div>
            <div onClick={moveToWatcherView}>Im a watcher</div>
        </div>
    );
};

export default ModeLayout;
