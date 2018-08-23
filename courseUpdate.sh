# TO BE RUN FROM ROOT DIRECTORY

echo "UPDATING COURSE "$1

#cd /home/galileo

export GALILEO_ENV='prod'
cd curriculum
git pull
cd ..
if [ "$1" == "all" ]
then
	for input in $(find . -name "info.md" | awk -F'\/' '{print $3}')
	do
		"Updating course "$input
		ts-node src/seed-courses.ts --courseDir $input
	done
else
	echo "Updating course "$1
	ts-node src/seed-courses.ts --courseDir $1
fi
