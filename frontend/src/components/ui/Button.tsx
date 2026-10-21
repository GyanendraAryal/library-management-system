interface ButtonProps {
  size?: string;
  title?: string;
}

function Button({ size = "", title }: ButtonProps) {
  let className = size;
  if (className === "btn-xs") {
    className += " rounded-xs px-1 py-0.5 text-[7px] font-medium";
  } else if (className == "btn-sm") {
    className += " rounded-xs px-5 py-1 text-[8px] font-medium";
  } else if (className == "btn-md") {
    className += " rounded-sm px-9 py-1 text-[8px] font-medium text-[#E5EDE5]";
  }
  return <button className={className}>{title}</button>;
}

export default Button;
