# TO BE RUN FROM ROOT DIRECTORY

echo "UPDATING COURSE "$1

#cd /home/galileo

export GALILEO_ENV='prod'
cd curriculum
git pull > /dev/null
cd ..
if [ "$1" == "all" ]
then
	for input in $(find . -name "info.md" | awk -F'\/' '{print $3}')
	do
		ts-node src/seed-courses.ts --courseDir $input
	done
else
	ts-node src/seed-courses.ts --courseDir $1
fi
