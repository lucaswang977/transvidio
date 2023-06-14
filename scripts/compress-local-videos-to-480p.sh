#!/bin/bash
#
input_dir="./"
output_dir="./compressed_videos/"

mkdir -p "$output_dir"

for video_file in "$input_dir"*.mp4; do
  filename=$(basename -- "$video_file")
  filename="${filename%.*}"

  ffmpeg -i "$video_file" -vf "scale=854:480" -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k "${output_dir}${filename}_480p.mp4"
done
