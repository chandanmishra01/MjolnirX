const ProgressBar = (props) => {
    const { bgcolor, completed, height } = props;
  
    const containerStyles = {
      height: height,
      width: '100%',
      backgroundColor: "rgb(111 106 106)",
      borderRadius: 50,
      border: 'solid 1px #1be1cf'
    }
  
    const fillerStyles = {
      height: '100%',
      width: `${completed}%`,
      backgroundColor: bgcolor,
      borderRadius: 'inherit',
      textAlign: 'right'
    }

    return (
      <div style={containerStyles}>
        <div style={fillerStyles}>
        </div>
      </div>
    );
  };
  
  export default ProgressBar;